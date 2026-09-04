"""
ai_engine/model_feedback_tuner.py
---------------------------------
Human-in-the-Loop Feedback Loop & Dynamic Weight Calibration Engine.

Tracks officer overrides when an AI verdict is corrected, calibrates risk weights,
and attaches immutable model lineage metadata to every forensic audit.
"""

from typing import Dict, Any, List
from ai_engine.logger import setup_logger

logger = setup_logger("SherDetect.ModelFeedbackTuner")

# Model Metadata & Version Lineage
MODEL_LINEAGE_METADATA = {
    "engine_version": "2.0.1-enterprise",
    "prompt_version": "gemini-1.5-flash-v2.1-zero-bias",
    "scoring_weights_version": "w2026.09.04",
    "weights": {
        "ela_weight": 0.35,
        "semantic_weight": 0.30,
        "metadata_weight": 0.15,
        "benford_weight": 0.10,
        "checksum_weight": 0.10
    }
}


class ModelFeedbackTuner:
    _feedback_log: List[Dict[str, Any]] = []

    @classmethod
    def record_verifier_override(
        cls,
        doc_id: str,
        ai_verdict: str,
        human_decision: str,
        reviewer: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Record a human officer correction when the officer overrides an AI determination.
        """
        feedback_entry = {
            "doc_id": doc_id,
            "ai_verdict": ai_verdict,
            "human_decision": human_decision,
            "reviewer": reviewer,
            "reason": reason,
            "model_version": MODEL_LINEAGE_METADATA["engine_version"],
            "weights_version": MODEL_LINEAGE_METADATA["scoring_weights_version"]
        }
        cls._feedback_log.append(feedback_entry)
        logger.info(f"Recorded Human-in-the-Loop override for doc_id={doc_id}: AI '{ai_verdict}' -> Officer '{human_decision}'")
        return feedback_entry

    @classmethod
    def compute_weight_calibration_recommendations(cls) -> Dict[str, Any]:
        """
        Analyzes historical officer overrides to calculate proposed weight tuning adjustments.
        """
        total_overrides = len(cls._feedback_log)
        if total_overrides == 0:
            return {
                "status": "INSUFFICIENT_DATA",
                "message": "No human overrides logged yet. Current weights remain optimal.",
                "current_weights": MODEL_LINEAGE_METADATA["weights"]
            }

        # Analyze override patterns
        false_positives = sum(1 for f in cls._feedback_log if f["ai_verdict"] == "FORGERY_DETECTED" and f["human_decision"] == "VERIFIED")
        false_negatives = sum(1 for f in cls._feedback_log if f["ai_verdict"] == "VERIFIED_AUTHENTIC" and f["human_decision"] == "REJECTED")

        proposed_weights = dict(MODEL_LINEAGE_METADATA["weights"])

        # Micro-calibrate weights based on override bias
        if false_positives > false_negatives:
            # ELA/Semantic threshold was too sensitive -> slight decrease in ELA weight
            proposed_weights["ela_weight"] = round(max(0.25, proposed_weights["ela_weight"] - 0.02), 2)
            proposed_weights["semantic_weight"] = round(min(0.35, proposed_weights["semantic_weight"] + 0.02), 2)
        elif false_negatives > false_positives:
            # Under-sensitive -> increase metadata & ELA weights
            proposed_weights["metadata_weight"] = round(min(0.25, proposed_weights["metadata_weight"] + 0.02), 2)

        return {
            "status": "CALIBRATION_RECOMMENDED",
            "total_overrides_analyzed": total_overrides,
            "false_positives_count": false_positives,
            "false_negatives_count": false_negatives,
            "current_weights": MODEL_LINEAGE_METADATA["weights"],
            "proposed_calibrated_weights": proposed_weights
        }
