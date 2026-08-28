"""
ai_engine/benford_inspector.py
------------------------------
Statistical Forensic Accounting via Benford's Law (First-Digit Law).
Evaluates if numeric financial figures in the document follow natural
logarithmic distributions: P(d) = log10(1 + 1/d).
Fabricated or manually manipulated invoices frequently violate this
distribution or exhibit abnormal digit clustering.
"""

import re
import math
from typing import Dict, List, Any


class BenfordInspector:
    # Theoretical Benford distribution for leading digits 1 through 9
    BENFORD_PROBABILITIES = {
        1: 0.301,
        2: 0.176,
        3: 0.125,
        4: 0.097,
        5: 0.079,
        6: 0.067,
        7: 0.058,
        8: 0.051,
        9: 0.046
    }

    @classmethod
    def extract_first_digits(cls, text: str) -> List[int]:
        """Extracts leading non-zero digits from financial numbers in the text."""
        # Match positive floating point or integer numbers
        raw_numbers = re.findall(r"(?<![a-zA-Z0-9_])\d+(?:\.\d{1,2})?(?![a-zA-Z0-9_])", text)
        leading_digits = []
        for num in raw_numbers:
            clean = num.lstrip("0")
            if clean and clean[0].isdigit() and clean[0] != "0":
                leading_digits.append(int(clean[0]))
        return leading_digits

    @classmethod
    def analyze_benford(cls, text: str, min_sample_size: int = 5) -> Dict[str, Any]:
        """
        Performs statistical divergence analysis against Benford's Law.
        Returns anomaly metrics, MAD (Mean Absolute Deviation), and a forensic score.
        """
        digits = cls.extract_first_digits(text)
        n = len(digits)

        # Insufficient sample size for statistical significance
        if n < min_sample_size:
            return {
                "sampleSize": n,
                "isBenfordAnomaly": False,
                "madScore": 0.0,
                "anomalyRiskScore": 0.0,
                "summary": "Sample size too small for statistical Benford test (requires >= 5 numbers)."
            }

        # Calculate observed frequencies
        counts = {d: 0 for d in range(1, 10)}
        for d in digits:
            counts[d] += 1

        observed_freq = {d: counts[d] / n for d in range(1, 10)}

        # Mean Absolute Deviation (MAD)
        mad = sum(abs(observed_freq[d] - cls.BENFORD_PROBABILITIES[d]) for d in range(1, 10)) / 9.0
        
        # Check for abnormal digit repetition (e.g. > 60% of numbers start with the exact same digit)
        max_single_digit_freq = max(observed_freq.values())
        repetitive_clustering = max_single_digit_freq > 0.60 and n >= 5

        # Forensic threshold: MAD > 0.035 indicates non-conformity in forensic accounting
        is_anomaly = mad > 0.045 or repetitive_clustering

        anomaly_score = min(100.0, round(mad * 1200.0, 1)) if is_anomaly else round(mad * 300.0, 1)

        anomalies = []
        if is_anomaly:
            anomalies.append({
                "type": "BENFORD_DISTRIBUTION_ANOMALY",
                "description": f"Digit frequency Mean Absolute Deviation (MAD={mad:.4f}) deviates significantly from Benford's Law. Indicates potential synthetic or manually fabricated figures."
            })

        return {
            "sampleSize": n,
            "isBenfordAnomaly": is_anomaly,
            "madScore": round(mad, 4),
            "anomalyRiskScore": min(100.0, max(0.0, anomaly_score)),
            "detectedAnomalies": anomalies,
            "summary": (
                f"Statistical audit flagged abnormal numeric distribution (MAD={mad:.4f})."
                if is_anomaly
                else f"Numeric distribution conforms to natural Benford's Law (MAD={mad:.4f})."
            )
        }
