import time
import hashlib
from typing import Dict, Any, Optional

from ai_engine.ela_engine import compute_ela_and_anomalies
from ai_engine.ai_validator import validate_document_semantics
from ai_engine.benford_inspector import BenfordInspector
from ai_engine.checksum_validator import ChecksumValidator
from ai_engine.metadata_scanner import MetadataScanner
from ai_engine.sharpness_inspector import SharpnessInspector
from ai_engine.pii_sanitizer import PIISanitizer
from ai_engine.risk_scorer import RiskScorer
from ai_engine.document_text import extract_document_text
from ai_engine.logger import setup_logger

logger = setup_logger("SherDetect.CoreProcessor")

async def process_document_bytes(
    contents: bytes,
    file_name: str,
    content_type: str,
    start_time: Optional[float] = None
) -> Dict[str, Any]:
    """
    Core forensic analysis pipeline decoupled from HTTP layer to allow 
    both synchronous API execution and asynchronous Celery worker execution.
    """
    if start_time is None:
        start_time = time.time()
        
    doc_id = f"DOC-{int(time.time()) % 10000:04d}"
    
    # Calculate SHA-256 Cryptographic Hash (Immutable Audit Trail)
    file_hash = hashlib.sha256(contents).hexdigest()
    
    # 0. Convert PDF to Image for visual analysis (if applicable)
    image_contents = contents
    converted_image_base64 = None
    if content_type == "application/pdf" or file_name.lower().endswith(".pdf"):
        try:
            import fitz
            import base64
            doc = fitz.open(stream=contents, filetype="pdf")
            page = doc.load_page(0)
            pix = page.get_pixmap(dpi=150)
            image_contents = pix.tobytes("png")
            converted_image_base64 = f"data:image/png;base64,{base64.b64encode(image_contents).decode()}"
        except Exception as e:
            logger.error(f"Failed to convert PDF to image: {e}")

    # 1. Binary Stream & EXIF Metadata Tamper Scan
    metadata_res = MetadataScanner.scan_bytes(contents)

    # 2. ELA & Anomaly Bounding Box Detection
    try:
        ela_score, heatmap_base64, anomalies = compute_ela_and_anomalies(image_contents)
    except Exception:
        # ELA is image-only. Do not invent a score or anomaly for PDFs.
        ela_score = 0.0
        anomalies = []
        heatmap_base64 = None

    # 3. Laplacian Variance Edge Sharpness Inconsistency Inspection
    sharpness_res = SharpnessInspector.analyze_sharpness_inconsistency(image_contents)
    if sharpness_res["hasSharpnessAnomaly"]:
        anomalies.extend(sharpness_res["detectedAnomalies"])

    # 4. Text extraction simulation & PII sanitization
    extracted_text = extract_document_text(contents, content_type)
    if not extracted_text:
        extracted_text = "No machine-readable document text was available for semantic audit."
    sanitized_text, _ = PIISanitizer.sanitize(extracted_text)

    # 5. Checksum Arithmetic & Benford Analysis
    checksum_res = ChecksumValidator.audit_document_ids(sanitized_text)
    benford_res = BenfordInspector.analyze_benford(sanitized_text)

    # 6. Gemini AI Semantic Validation
    ai_res = await validate_document_semantics(
        sanitized_text,
        "image/png" if converted_image_base64 else (content_type or "unknown"),
        image_contents,
    )

    processing_time_ms = int((time.time() - start_time) * 1000)

    # Combine detected software signatures
    detected_software = metadata_res.get("detectedSoftware")
    is_metadata_tampered = metadata_res["isMetadataTampered"] or checksum_res["hasChecksumAnomaly"]

    # 7. Combined Risk Scoring via RiskScorer
    report = RiskScorer.aggregate_forensic_report(
        document_id=doc_id,
        ela_score=ela_score,
        pixel_anomalies=anomalies,
        heatmap_b64=heatmap_base64,
        semantic_result=ai_res,
        benford_result=benford_res,
        metadata_tampered=is_metadata_tampered,
        software_detected=detected_software,
        sharpness_result=sharpness_res,
        processing_time_ms=processing_time_ms,
        file_hash=file_hash
    )
    
    if converted_image_base64:
        report["previewUrl"] = converted_image_base64

    return report
