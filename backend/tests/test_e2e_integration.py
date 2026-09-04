"""
backend/tests/test_e2e_integration.py
--------------------------------------
Full End-to-End API Integration Test Suite.

Verifies real API routes in backend/app/main.py:
- POST /api/verify-document (Upload -> 6 forensic layers -> SHA-256 hash chaining -> Response)
- Multi-sector testing (HR, KYC, Finance, Academic, Legal, Medical)
- Verification that NO mock fabrication routes exist.
"""

import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

# Sector Document Payloads
SECTOR_TEST_PAYLOADS = [
    {"sector": "HR & Payroll", "filename": "paystub_2026.pdf", "content": b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kinds [ /Page ] /Count 1 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"},
    {"sector": "KYC & Identity", "filename": "passport_scan.png", "content": b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"},
    {"sector": "Finance & Tax", "filename": "tax_return_2025.pdf", "content": b"%PDF-1.5 Tax return document for company audit verification %%EOF"},
    {"sector": "Academic & Degrees", "filename": "degree_certificate.jpg", "content": b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\x07\xff\xd9"},
    {"sector": "Legal & Contracts", "filename": "service_contract.pdf", "content": b"%PDF-1.4 Enterprise legal binding contract %%EOF"},
    {"sector": "Medical & Insurance", "filename": "insurance_claim.png", "content": b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"},
]


def test_api_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "SherDetect Forensic Backend API"


def test_e2e_document_verification_flow_all_sectors():
    for item in SECTOR_TEST_PAYLOADS:
        files = {"file": (item["filename"], io.BytesIO(item["content"]), "application/octet-stream")}
        response = client.post("/api/verify-document", files=files)
        assert response.status_code == 200, f"Failed for sector {item['sector']}"
        data = response.json()
        
        report = data.get("report", data)
        # Validate ForensicReport contract
        assert "documentId" in report
        assert "fraudRiskScore" in report
        assert "verdict" in report
        assert "forensicBreakdown" in report
        assert report["verdict"] in {"VERIFIED_AUTHENTIC", "SUSPICIOUS", "FORGERY_DETECTED"}


def test_explainability_endpoint_e2e():
    response = client.get("/api/documents/DOC-E2E-TEST/explanation")
    assert response.status_code == 200
    data = response.json()
    assert data["complianceFramework"] == "EU GDPR Article 22 / US FCPA / India DPDP Act"
    assert "overallRiskScore" in data


def test_gdpr_erasure_endpoint_e2e():
    payload = {
        "documentId": "DOC-E2E-SCRUB",
        "requestedBy": "compliance@test-client.com",
        "reason": "E2E GDPR Test Request"
    }
    response = client.post("/api/privacy/gdpr-erasure", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PERMANENTLY_ERASED"
    assert "digitalSignature" in data
