import pytest
from ai_engine.compliance_engine import (
    CryptographicAuditTrail,
    GDPRErasureEngine,
    DataRetentionPolicy,
    ExplainabilityReportGenerator
)

def test_cryptographic_hash_chaining():
    entry1 = CryptographicAuditTrail.create_chained_entry(
        doc_id="DOC-1001",
        action="VERIFIED",
        actor="Officer Smith",
        note="Verified authentic degree"
    )
    entry2 = CryptographicAuditTrail.create_chained_entry(
        doc_id="DOC-1002",
        action="REJECTED",
        actor="Officer Davis",
        note="Photoshop tamper detected"
    )
    
    assert entry1["previous_hash"] != entry1["entry_hash"]
    assert entry2["previous_hash"] == entry1["entry_hash"]
    assert len(entry2["entry_hash"]) == 64  # SHA-256 hex length

def test_gdpr_erasure_certificate():
    cert = GDPRErasureEngine.execute_erasure_request(
        document_id="DOC-9981-PRIVATE",
        requested_by="citizen@eu-domain.org",
        reason="GDPR Article 17 Right-to-Erasure Request"
    )
    assert cert["status"] == "PERMANENTLY_ERASED"
    assert "DEL-CERT-" in cert["erasureCertificateId"]
    assert len(cert["digitalSignature"]) == 64

def test_data_retention_policy_expiry():
    import time
    old_timestamp = time.time() - (91 * 86400) # 91 days old
    recent_timestamp = time.time() - (10 * 86400) # 10 days old
    
    assert DataRetentionPolicy.evaluate_retention_expiry(old_timestamp, retention_days=90) is True
    assert DataRetentionPolicy.evaluate_retention_expiry(recent_timestamp, retention_days=90) is False

def test_explainability_artifact_generation():
    report_data = {
        "documentId": "DOC-7712",
        "fraudRiskScore": 88.5,
        "verdict": "FORGERY_DETECTED",
        "forensicBreakdown": {
            "elaScore": 82.0,
            "metadataTampered": True,
            "softwareFingerprintDetected": "Adobe Photoshop CC 2023",
            "semanticDiscrepancy": True
        }
    }
    explanation = ExplainabilityReportGenerator.generate_explanation_artifact(report_data)
    assert explanation["complianceFramework"] == "EU GDPR Article 22 / US FCPA / India DPDP Act"
    assert explanation["decisionImpact"] == "REJECTED_FORGERY"
    assert len(explanation["primaryContributeFactors"]) == 3
