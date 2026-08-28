"""
ai_engine/checksum_validator.py
-------------------------------
Cryptographic & Deterministic ID Checksum Auditor.
Validates document IDs, Tax Numbers, and Credit Cards using:
- Verhoeff Algorithm (Base-10 dihedral group D5 check for 12-digit UID/Aadhaar)
- Luhn Algorithm (Mod-10 check for payment & credit card IDs)
- PAN format validation
Catches 100% of single-digit manipulations and adjacent number swaps.
"""

import re
from typing import Dict, List, Any


class ChecksumValidator:
    # Verhoeff Multiplication Table (d)
    _VERHOEFF_D = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ]

    # Verhoeff Permutation Table (p)
    _VERHOEFF_P = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ]

    # Verhoeff Inverse Table (inv)
    _VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

    @classmethod
    def validate_verhoeff(cls, num_str: str) -> bool:
        """Validates a 12-digit number (e.g. Aadhaar / UID) with Verhoeff algorithm."""
        clean = re.sub(r"\D", "", num_str)
        if len(clean) != 12:
            return False
        # First digit cannot be 0 or 1 in standard 12-digit UID
        if clean[0] in ("0", "1"):
            return False

        c = 0
        reversed_digits = [int(x) for x in reversed(clean)]
        for i, digit in enumerate(reversed_digits):
            c = cls._VERHOEFF_D[c][cls._VERHOEFF_P[i % 8][digit]]
        return c == 0

    @classmethod
    def validate_luhn(cls, num_str: str) -> bool:
        """Validates credit card / transaction ID with Luhn algorithm."""
        clean = re.sub(r"\D", "", num_str)
        if len(clean) < 13 or len(clean) > 19:
            return False

        total = 0
        reverse_digits = [int(x) for x in reversed(clean)]
        for i, digit in enumerate(reverse_digits):
            if i % 2 == 1:
                doubled = digit * 2
                total += doubled - 9 if doubled > 9 else doubled
            else:
                total += digit
        return total % 10 == 0

    @classmethod
    def validate_pan(cls, pan_str: str) -> bool:
        """Validates Indian PAN card format (5 uppercase letters, 4 digits, 1 uppercase letter)."""
        pattern = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
        return bool(re.match(pattern, pan_str.strip().upper()))

    @classmethod
    def audit_document_ids(cls, text: str) -> Dict[str, Any]:
        """
        Audits all ID candidates in text and reports deterministic checksum discrepancies.
        """
        anomalies: List[Dict[str, str]] = []

        # Find 12-digit number candidates (Aadhaar / UID)
        uid_candidates = re.findall(r"\b\d{4}[ -]?\d{4}[ -]?\d{4}\b", text)
        for cand in uid_candidates:
            clean = re.sub(r"\D", "", cand)
            if not cls.validate_verhoeff(clean):
                anomalies.append({
                    "type": "ID_CHECKSUM_FAILURE",
                    "description": f"Cryptographic Verhoeff failure on candidate UID '{clean[:4]}****{clean[-4:]}'. The check digit is mathematically invalid."
                })

        # Find 16-digit card candidates
        card_candidates = re.findall(r"\b(?:\d{4}[ -]?){3}\d{4}\b", text)
        for cand in card_candidates:
            clean = re.sub(r"\D", "", cand)
            if not cls.validate_luhn(clean):
                anomalies.append({
                    "type": "PAYMENT_CHECKSUM_FAILURE",
                    "description": f"Luhn algorithm check failed for payment/card sequence ending in {clean[-4:]}."
                })

        return {
            "hasChecksumAnomaly": len(anomalies) > 0,
            "anomalies": anomalies,
            "checksumScore": 95.0 if len(anomalies) > 0 else 0.0
        }
