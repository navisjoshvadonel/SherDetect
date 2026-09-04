import pytest
from ai_engine.risk_scorer import compute_forensic_verdict
from ai_engine.ai_validator import extract_fallback_heuristics
from ai_engine.benchmark_evaluator import SectorBenchmarkEvaluator

def test_adversarial_metadata_stripping_attack():
    """
    Attacker strips metadata to evade EXIF scanners.
    Verification: High ELA re-compression + AI semantic discrepancy still triggers FORGERY_DETECTED.
    """
    verdict = compute_forensic_verdict(
        ela_score=85.0,            # High ELA score (tampered region)
        metadata_tampered=False,   # EXIF metadata stripped (attacker evasion)
        sharpness_variance=90.0,
        benford_kl_divergence=0.25,
        has_checksum_anomaly=False,
        semantic_discrepancy=True  # Gemini / offline heuristic caught typo
    )
    assert verdict["verdict"] == "FORGERY_DETECTED"
    assert verdict["score"] >= 75.0

def test_adversarial_gaussian_noise_evasion():
    """
    Attacker adds heavy noise to obscure pixel compression artifacts.
    Verification: Benford first-digit law failure + Checksum anomaly catches the attack.
    """
    verdict = compute_forensic_verdict(
        ela_score=15.0,            # Low ELA due to noise obscuration
        metadata_tampered=False,
        sharpness_variance=12.0,
        benford_kl_divergence=0.35, # Benford law anomaly triggered by noise
        has_checksum_anomaly=True, # ID checksum failure
        semantic_discrepancy=False
    )
    assert verdict["verdict"] in {"FORGERY_DETECTED", "SUSPICIOUS"}
    assert verdict["score"] >= 45.0

def test_adversarial_spelling_substitution_attack():
    """
    Attacker uses common certificate keyword misspellings (e.g. "Certifcate of Completion").
    Verification: Offline Heuristic typo regex detects the misspelling.
    """
    text = "This Certifcate of Completion is awarded by Stanford University."
    heuristics = extract_fallback_heuristics(text, "application/pdf")
    assert heuristics["semanticDiscrepancy"] is True
    assert any(a["type"] == "CONTENT_TYPO" for a in heuristics["detectedAnomalies"])

def test_adversarial_boundary_escalation_guard():
    """
    Sample with risk score in 40%-60% boundary range MUST trigger SUSPICIOUS and human review.
    """
    verdict = compute_forensic_verdict(
        ela_score=35.0,
        metadata_tampered=True,
        sharpness_variance=25.0,
        benford_kl_divergence=0.08,
        has_checksum_anomaly=False,
        semantic_discrepancy=False
    )
    assert verdict["verdict"] == "SUSPICIOUS"
    assert verdict["humanReviewRecommended"] is True

def test_sector_benchmark_evaluation_suite():
    """
    Verifies that the sector benchmark suite calculates precision/recall/F1 across all 6 sectors.
    """
    report = SectorBenchmarkEvaluator.evaluate_sector_performance()
    assert report["overall_accuracy"] >= 0.90
    assert report["overall_f1_score"] >= 0.90
    assert "HR & Payroll" in report["sector_metrics"]
    assert "KYC & Identity" in report["sector_metrics"]
    assert "APAC" in report["regional_fairness_accuracy"]
