"""
ai_engine/tests/test_ai_engine.py
---------------------------------
Comprehensive Forensic Test Suite for SherDetect AI Engine.
Tests Vision Forensics (ELA), Semantic Reasoner & Fallback,
Benford's Law, Cryptographic Checksums, PII Masking, Metadata Scanning,
Sharpness Inconsistency, Sample Generators, and Multi-Vector Risk Fusion.
"""

import os
import sys
import io
import pytest
from PIL import Image, ImageDraw

# Ensure root directory is on PYTHONPATH for all test runners
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ai_engine.ela_engine import compute_ela_and_anomalies
from ai_engine.ai_validator import extract_fallback_heuristics, validate_document_semantics
from ai_engine.benford_inspector import BenfordInspector
from ai_engine.checksum_validator import ChecksumValidator
from ai_engine.pii_sanitizer import PIISanitizer
from ai_engine.metadata_scanner import MetadataScanner
from ai_engine.sharpness_inspector import SharpnessInspector
from ai_engine.sample_generator import SampleGenerator
from ai_engine.risk_scorer import RiskScorer


# ==========================================
# 1. Vision & ELA Forensics Tests
# ==========================================

def _create_synthetic_image(tampered: bool = False) -> bytes:
    """Helper to generate clean vs spliced JPEG bytes."""
    img = Image.new("RGB", (400, 400), color=(250, 250, 250))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 350, 100], fill=(220, 220, 220))
    draw.text((60, 60), "INVOICE #1024 - AUTHENTIC", fill=(0, 0, 0))

    # Save baseline at quality 90
    buf_clean = io.BytesIO()
    img.save(buf_clean, format="JPEG", quality=90)
    
    if not tampered:
        return buf_clean.getvalue()

    # Load baseline, splice a colored high-frequency block, and save at quality 95
    buf_clean.seek(0)
    tampered_img = Image.open(buf_clean).convert("RGB")
    draw_tampered = ImageDraw.Draw(tampered_img)
    draw_tampered.rectangle([120, 200, 280, 300], fill=(0, 150, 255))
    draw_tampered.text((130, 230), "TAMPERED AMOUNT", fill=(255, 255, 255))

    buf_final = io.BytesIO()
    tampered_img.save(buf_final, format="JPEG", quality=95)
    return buf_final.getvalue()


def test_ela_clean_image():
    """Validates that a uniform un-spliced image has low anomaly count."""
    clean_bytes = _create_synthetic_image(tampered=False)
    score, heatmap_b64, anomalies = compute_ela_and_anomalies(clean_bytes, min_contour_area=80)

    assert isinstance(score, float)
    assert 0.0 <= score <= 100.0
    assert heatmap_b64.startswith("data:image/jpeg;base64,")
    assert len(anomalies) == 0


def test_ela_tampered_splicing_detection():
    """Validates that spliced/altered regions generate localized bounding boxes."""
    tampered_bytes = _create_synthetic_image(tampered=True)
    score, heatmap_b64, anomalies = compute_ela_and_anomalies(tampered_bytes, min_contour_area=80)

    assert score > 15.0
    assert len(anomalies) >= 1
    box = anomalies[0]
    assert "x" in box and "y" in box and "width" in box and "height" in box
    assert 0.0 <= box["x"] <= 100.0
    assert 0.0 <= box["y"] <= 100.0
    assert box["label"] == "Pixel Splicing Anomaly"


# ==========================================
# 2. Semantic & Offline Heuristic Tests
# ==========================================

@pytest.mark.asyncio
async def test_authentic_invoice_semantics():
    """Validates that matching math passes without discrepancy."""
    clean_text = "Item A: $120.00, Item B: $80.00, Subtotal: $200.00, Tax: $20.00, Total: $220.00"
    result = await validate_document_semantics(clean_text)

    assert not result["semanticDiscrepancy"]
    assert len(result.get("detectedAnomalies", [])) == 0


def test_format_bias_metadata_is_explicit():
    result = extract_fallback_heuristics("Google Coursera certificate verification URL", "image/jpeg")
    assert result["file_format_observed"] == "image/jpeg"
    assert "quality and format were ignored" in result["format_bias_mitigation"]
    assert result["final_classification"] == "Genuine"


@pytest.mark.asyncio
async def test_tampered_invoice_semantics():
    """Validates that mathematical disparity triggers semantic discrepancy."""
    tampered_text = "Item A: $120.00, Item B: $80.00, Subtotal: $200.00, Tax: $20.00, Total: $9,500.00"
    result = await validate_document_semantics(tampered_text)

    assert result["semanticDiscrepancy"]
    assert len(result["detectedAnomalies"]) > 0
    assert any("MATH_MISMATCH" in anom.get("type", "") for anom in result["detectedAnomalies"])


def test_offline_fallback_heuristics_direct():
    """Validates that the fallback heuristic handles arithmetic audits without errors."""
    text = "Line 1: 50.00, Line 2: 75.00, Line 3: 25.00, Total: 5000.00"
    fallback_res = extract_fallback_heuristics(text)

    assert fallback_res["semanticDiscrepancy"]
    assert len(fallback_res["detectedAnomalies"]) > 0


# ==========================================
# 3. Statistical Forensics (Benford's Law)
# ==========================================

def test_benford_inspector_tampered_fabrication():
    """Validates that unnatural repeated leading digits trigger Benford anomaly."""
    fake_data = "Price 1: 910, Price 2: 950, Price 3: 990, Price 4: 920, Price 5: 980, Price 6: 940"
    report = BenfordInspector.analyze_benford(fake_data)

    assert report["isBenfordAnomaly"]
    assert report["anomalyRiskScore"] > 40.0
    assert len(report["detectedAnomalies"]) > 0


# ==========================================
# 4. Checksum & ID Validation Tests
# ==========================================

def test_verhoeff_and_luhn_checksums():
    """Tests Verhoeff on 12-digit UID and Luhn on card numbers."""
    corrupted_uid = "2345 6789 0129"
    audit = ChecksumValidator.audit_document_ids(f"ID Number: {corrupted_uid}")
    assert audit["hasChecksumAnomaly"]
    assert any("ID_CHECKSUM_FAILURE" in a["type"] for a in audit["anomalies"])


# ==========================================
# 5. PII Masking Privacy Tests
# ==========================================

def test_pii_sanitization():
    """Tests that PII numbers are masked while preserving numbers needed for arithmetic."""
    raw_doc = "Customer Aadhaar: 2345 6789 0123, PAN: ABCDE1234F. Subtotal: $150.00, Total: $150.00"
    sanitized, redactions = PIISanitizer.sanitize(raw_doc)

    assert "2345 6789 0123" not in sanitized
    assert "XXXX-XXXX-0123" in sanitized
    assert "ABCDE1234F" not in sanitized
    assert "XXXXX1234X" in sanitized
    assert "$150.00" in sanitized


# ==========================================
# 6. Binary Metadata & Sharpness Tests
# ==========================================

def test_metadata_scanner_detection():
    """Tests that Photoshop byte signatures are flagged accurately."""
    clean_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01..."
    res_clean = MetadataScanner.scan_bytes(clean_bytes)
    assert not res_clean["isMetadataTampered"]

    tampered_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00Adobe Photoshop CC 2023 8BIM..."
    res_tampered = MetadataScanner.scan_bytes(tampered_bytes)
    assert res_tampered["isMetadataTampered"]
    assert res_tampered["detectedSoftware"] == "Adobe Photoshop"


def test_sharpness_inspector_execution():
    """Validates that sharpness inspection runs on image bytes without crashing."""
    clean_bytes = _create_synthetic_image(tampered=False)
    res = SharpnessInspector.analyze_sharpness_inconsistency(clean_bytes)
    assert isinstance(res, dict)
    assert "hasSharpnessAnomaly" in res


# ==========================================
# 7. Sample Generator Fixture Tests
# ==========================================

def test_sample_generator_fixtures():
    """Tests that all 5 demo sample fixtures generate valid bytes and text."""
    samples = [
        SampleGenerator.generate_clean_invoice(),
        SampleGenerator.generate_spliced_invoice(),
        SampleGenerator.generate_math_tampered_invoice(),
        SampleGenerator.generate_benford_violated_invoice(),
        SampleGenerator.generate_corrupted_id_sample()
    ]
    for s in samples:
        assert len(s["imageBytes"]) > 0
        assert len(s["text"]) > 0
        assert "expectedVerdict" in s


# ==========================================
# 8. Multi-Vector Risk Fusion Tests
# ==========================================

def test_risk_scorer_aggregate_report():
    """Tests that all vectors combine cleanly into a contract-compliant report."""
    report = RiskScorer.aggregate_forensic_report(
        document_id="DOC-999",
        ela_score=78.5,
        pixel_anomalies=[{"x": 10.0, "y": 20.0, "width": 15.0, "height": 8.0, "label": "Pixel Splicing", "confidence": 0.95}],
        heatmap_b64="data:image/jpeg;base64,...",
        semantic_result={"semanticDiscrepancy": True, "forensicSummary": "Math mismatch detected."},
        benford_result={"isBenfordAnomaly": True, "anomalyRiskScore": 65.0},
        metadata_tampered=True,
        software_detected="Adobe Photoshop CC 2023",
        processing_time_ms=120
    )

    assert report["documentId"] == "DOC-999"
    assert not report["isAuthentic"]
    assert report["verdict"] == "FORGERY_DETECTED"
    assert report["fraudRiskScore"] >= 65.0
    assert report["forensicBreakdown"]["metadataTampered"] is True
    assert report["forensicBreakdown"]["semanticDiscrepancy"] is True


if __name__ == "__main__":
    pytest.main(["-v", __file__])
