import io
import os
import time
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from ai_engine.ela_engine import compute_ela_and_anomalies
from ai_engine.ai_validator import validate_document_semantics
from ai_engine.benford_inspector import BenfordInspector
from ai_engine.checksum_validator import ChecksumValidator
from ai_engine.metadata_scanner import MetadataScanner
from ai_engine.sharpness_inspector import SharpnessInspector
from ai_engine.pii_sanitizer import PIISanitizer
from ai_engine.risk_scorer import RiskScorer
from ai_engine.sample_generator import SampleGenerator
from ai_engine.document_text import extract_document_text

app = FastAPI(
    title="SherDetect AI Forensic Engine API",
    description="Live Python Forensic Engine providing ELA heatmaps, Metadata EXIF scanning, Sharpness inconsistency, Benford analysis, math checksums, and Gemini AI semantic validation.",
    version="1.1.0",
)

ALLOWED_ORIGINS_ENV = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SherDetect AI Forensic Engine", "version": "1.1.0"}

@app.get("/api/sample-documents")
def get_demo_samples():
    """Generates synthetic authentic and forged sample fixtures for live hackathon demos."""
    clean = SampleGenerator.generate_clean_invoice()
    spliced = SampleGenerator.generate_spliced_invoice()
    math_tampered = SampleGenerator.generate_math_tampered_invoice()
    benford_tampered = SampleGenerator.generate_benford_violated_invoice()
    corrupted_id = SampleGenerator.generate_corrupted_id_sample()

    return {
        "samples": [
            {"name": clean["filename"], "type": "authentic", "expectedVerdict": clean["expectedVerdict"]},
            {"name": spliced["filename"], "type": "forged_ela", "expectedVerdict": spliced["expectedVerdict"]},
            {"name": math_tampered["filename"], "type": "forged_math", "expectedVerdict": math_tampered["expectedVerdict"]},
            {"name": benford_tampered["filename"], "type": "forged_benford", "expectedVerdict": benford_tampered["expectedVerdict"]},
            {"name": corrupted_id["filename"], "type": "corrupted_id", "expectedVerdict": corrupted_id["expectedVerdict"]},
        ]
    }

MAX_FILE_SIZE_MB = 50

@app.post("/api/verify-document")
async def verify_document(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

        # 1. Immediate rejection via Content-Length header if present
        content_length = file.headers.get("content-length")
        if content_length and content_length.isdigit():
            if int(content_length) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum allowed limit of {MAX_FILE_SIZE_MB} MB.",
                )

        # 2. Chunked streaming read with byte quota guard
        byte_chunks = []
        total_bytes = 0
        chunk_size = 1024 * 1024

        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum allowed limit of {MAX_FILE_SIZE_MB} MB.",
                )
            byte_chunks.append(chunk)

        contents = b"".join(byte_chunks)
        file_name = file.filename or "uploaded_document.pdf"
        doc_id = f"DOC-{int(time.time()) % 10000:04d}"
        
        # 0. Convert PDF to Image for visual analysis (if applicable)
        image_contents = contents
        converted_image_base64 = None
        if file.content_type == "application/pdf" or file_name.lower().endswith(".pdf"):
            try:
                import fitz
                import base64
                doc = fitz.open(stream=contents, filetype="pdf")
                page = doc.load_page(0)
                pix = page.get_pixmap(dpi=150)
                image_contents = pix.tobytes("png")
                converted_image_base64 = f"data:image/png;base64,{base64.b64encode(image_contents).decode()}"
            except Exception as e:
                print(f"Failed to convert PDF to image: {e}")

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
        extracted_text = extract_document_text(contents, file.content_type)
        if not extracted_text:
            extracted_text = "No machine-readable document text was available for semantic audit."
        sanitized_text, _ = PIISanitizer.sanitize(extracted_text)

        # 5. Checksum Arithmetic & Benford Analysis
        checksum_res = ChecksumValidator.audit_document_ids(sanitized_text)
        benford_res = BenfordInspector.analyze_benford(sanitized_text)

        # 6. Gemini AI Semantic Validation
        ai_res = await validate_document_semantics(
            sanitized_text,
            "image/png" if converted_image_base64 else (file.content_type or "unknown"),
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
            processing_time_ms=processing_time_ms
        )
        
        if converted_image_base64:
            report["previewUrl"] = converted_image_base64

        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai_engine.server:app", host="0.0.0.0", port=8000, reload=True)
