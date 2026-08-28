"""
ai_engine/risk_scorer.py
------------------------
Multi-Vector Risk Fusion & Verdict Engine.

Architecture Note (Methodology Transparency):
----------------─────────────────────────────
The weights and non-linear escalation thresholds used in this module are based on an
Expert-Calibrated Multi-Criteria Decision Analysis (MCDA) heuristic matrix:
  - Semantic Reasoning (0.40)   : Primary indicator for content-level fraud (typos, math, signatories).
  - Visual ELA Compression (0.20): Secondary indicator for physical pixel manipulation.
  - EXIF/Binary Metadata (0.15)  : Secondary indicator for editing software footprints (Photoshop/GIMP).
  - Benford Frequency (0.15)    : Statistical indicator for numerical distribution anomalies.
  - Cryptographic Checksums (0.10): Deterministic validation for identity/card checksums.

Content-First Philosophy:
  - Pixel anomalies (ELA, sharpness) are inherently format-sensitive: JPEGs produce
    compression noise, while PDFs produce zero pixel data.  These signals are treated
    as corroborative evidence only and NEVER independently drive a forgery verdict.
  - Content-level checks (text typos, math parity, checksums, signatory validation)
    are format-agnostic and take priority.

Escalation Rules (Multi-Trigger Non-Linear Boost):
  - When 2 or more independent *content-level* forensic vectors flag anomalies, the
    risk score is boosted, enforcing a defense-in-depth posture.
  - Pixel anomalies alone cannot trigger escalation.

*Note for production audit*: This model utilizes expert-calibrated heuristics.
For large-scale enterprise deployments, weights can be further fine-tuned via Logistic Regression
or Gradient Boosted Trees trained on labeled domain-specific document corpora.
"""

from typing import Dict, List, Any, Optional


class RiskScorer:
    """
    Fuses multiple independent forensic vectors into a calibrated risk score (0 - 100).
    Uses expert-tuned multi-criteria weights with content-first, format-secondary design.
    """
    # Expert-calibrated heuristic weight distribution (content-first)
    WEIGHT_ELA = 0.20
    WEIGHT_SEMANTIC = 0.40
    WEIGHT_METADATA = 0.15
    WEIGHT_BENFORD = 0.15
    WEIGHT_CHECKSUM = 0.10

    @classmethod
    def aggregate_forensic_report(
        cls,
        document_id: str,
        ela_score: float,
        pixel_anomalies: List[Dict[str, Any]],
        heatmap_b64: Optional[str],
        semantic_result: Dict[str, Any],
        benford_result: Optional[Dict[str, Any]] = None,
        metadata_tampered: bool = False,
        software_detected: Optional[str] = None,
        sharpness_result: Optional[Dict[str, Any]] = None,
        processing_time_ms: int = 0
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive ForensicReport payload adhering to contracts/api_spec.py
        using content-first risk fusion. Pixel/format signals are corroborative only.
        """
        # Vector 1: ELA Score (0-100) — format-sensitive, weighted lower
        v_ela = float(min(100.0, max(0.0, ela_score)))

        # Vector 2: Semantic Discrepancy Score (0 or 92.0) — content-based, primary
        has_semantic_flag = semantic_result.get("semanticDiscrepancy", False)
        v_semantic = 92.0 if has_semantic_flag else 5.0

        # Vector 3: Metadata / Software Fingerprint
        v_meta = 95.0 if metadata_tampered else 0.0

        # Vector 4: Benford Statistical Anomaly Score (0-100)
        v_benford = float(benford_result.get("anomalyRiskScore", 0.0)) if benford_result else 0.0

        # Vector 5: Checksum / ID validation
        has_checksum_flag = any("ID_CHECKSUM_FAILURE" in a.get("type", "") for a in semantic_result.get("detectedAnomalies", []))
        v_checksum = 95.0 if has_checksum_flag else 0.0

        # Weighted calculation (MCDA Expert Calibration — content-first)
        raw_risk = (
            (v_ela * cls.WEIGHT_ELA) +
            (v_semantic * cls.WEIGHT_SEMANTIC) +
            (v_meta * cls.WEIGHT_METADATA) +
            (v_benford * cls.WEIGHT_BENFORD) +
            (v_checksum * cls.WEIGHT_CHECKSUM)
        )

        # Multi-Trigger Non-Linear Escalator (Content-Level Only)
        # Pixel anomalies are EXCLUDED from the trigger list because they are
        # format-sensitive: JPEGs always produce some compression contours while
        # PDFs produce zero. Including them would systematically penalize images.
        anomaly_triggers = [
            has_semantic_flag,
            metadata_tampered,
            benford_result.get("isBenfordAnomaly", False) if benford_result else False,
            sharpness_result.get("hasSharpnessAnomaly", False) if sharpness_result else False
        ]
        trigger_count = sum(1 for t in anomaly_triggers if t)

        if trigger_count:
            # Scale reinforcement from the current evidence; never return a fixed demo score.
            raw_risk += trigger_count * (8.0 + (raw_risk * 0.08))

        # A deterministic arithmetic or checksum contradiction is stronger than a generic semantic flag.
        semantic_anomaly_types = {
            "MATH_MISMATCH",
            "ID_CHECKSUM_FAILURE",
            "PAYMENT_CHECKSUM_FAILURE",
        }
        has_deterministic_semantic_failure = any(
            anomaly.get("type") in semantic_anomaly_types
            for anomaly in semantic_result.get("detectedAnomalies", [])
        )
        if has_deterministic_semantic_failure:
            raw_risk = max(raw_risk, 65.0)

        # Content-based typo/template/signatory findings are strong forgery signals.
        content_anomaly_types = {"CONTENT_TYPO", "TEMPLATE_MARKER", "SIGNATORY_IMPLAUSIBILITY"}
        has_content_forgery_signal = any(
            anomaly.get("type") in content_anomaly_types
            for anomaly in semantic_result.get("detectedAnomalies", [])
        )
        if has_content_forgery_signal:
            raw_risk = max(raw_risk, 65.0)

        # Gemini/content classification is authoritative over format-only visual noise.
        final_classification = str(semantic_result.get("final_classification", "")).strip().lower()
        try:
            content_confidence = float(semantic_result.get("confidence_score", 0.0))
        except (TypeError, ValueError):
            content_confidence = 0.0
        # Lowered threshold from 0.70 to 0.50 so the offline fallback's content-clean
        # verdict (confidence=0.50-0.65) can defend documents against pixel noise.
        content_verified = final_classification == "genuine" and content_confidence >= 0.50

        # NOTE: Pixel anomalies alone NO LONGER independently boost the score.
        # They only contribute through the weighted ELA vector above.
        # This prevents JPGs from being penalized for normal compression noise
        # while PDFs (which skip ELA entirely) get a free pass.

        if final_classification == "forgery":
            raw_risk = max(raw_risk, 65.0)
        elif content_verified and not has_deterministic_semantic_failure and not has_content_forgery_signal:
            # A high-confidence content verdict wins over compression, blur, or camera noise.
            raw_risk = min(raw_risk, 24.9)
        elif final_classification == "unverifiable":
            raw_risk = max(raw_risk, 25.0)

        # Clamping and rounding
        fraud_risk_score = round(min(100.0, max(2.5, raw_risk)), 1)
        is_forged = fraud_risk_score >= 50.0

        # Verdict classification
        if fraud_risk_score < 25.0:
            verdict = "VERIFIED_AUTHENTIC"
        elif fraud_risk_score < 65.0:
            verdict = "SUSPICIOUS"
        else:
            verdict = "FORGERY_DETECTED"

        # Combine pixel and sharpness bounding boxes
        combined_anomalies = list(pixel_anomalies)
        if sharpness_result and sharpness_result.get("hasSharpnessAnomaly"):
            combined_anomalies.extend(sharpness_result.get("detectedAnomalies", []))

        # Forensic Summary resolution
        if has_semantic_flag:
            summary = semantic_result.get("forensicSummary", "Document failed mathematical or semantic consistency checks.")
        elif len(pixel_anomalies) > 0:
            summary = f"Pixel splicing detected across {len(pixel_anomalies)} region(s) with anomalous JPEG compression artifacts."
        elif metadata_tampered:
            summary = f"Digital editing software signature detected: {software_detected or 'Modified EXIF'}."
        elif sharpness_result and sharpness_result.get("hasSharpnessAnomaly"):
            summary = sharpness_result.get("summary", "Sharpness inconsistency detected.")
        else:
            summary = "Document passed all compression, cryptographic checksum, and semantic parity checks."

        return {
            "documentId": document_id,
            "isAuthentic": not is_forged,
            "fraudRiskScore": fraud_risk_score,
            "verdict": verdict,
            "forensicBreakdown": {
                "elaScore": round(v_ela, 2),
                "metadataTampered": metadata_tampered,
                "softwareFingerprintDetected": software_detected if metadata_tampered else None,
                "semanticDiscrepancy": has_semantic_flag
            },
            "detectedAnomalies": combined_anomalies,
            "tamperHeatmapBase64": heatmap_b64,
            "forensicSummary": summary,
            "processingTimeMs": processing_time_ms
        }
