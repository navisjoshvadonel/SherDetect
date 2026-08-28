"""
ai_engine/pii_sanitizer.py
--------------------------
Privacy-Preserving PII Sanitizer & Masking Engine.
Scrubs sensitive citizen identification numbers (Aadhaar, PAN, Credit Cards,
Phone Numbers, Emails) from document text before sending to LLMs or logging,
while preserving mathematical quantities, dates, and amounts for audit.
"""

import re
from typing import Dict, List, Tuple


class PIISanitizer:
    # 12-digit Indian Aadhaar number (with optional spaces/hyphens)
    AADHAAR_REGEX = re.compile(r"\b([2-9]\d{3})[ -]?(\d{4})[ -]?(\d{4})\b")
    
    # 10-char Indian PAN Card number (5 letters, 4 digits, 1 letter)
    PAN_REGEX = re.compile(r"\b([A-Z]{5})(\d{4})([A-Z]{1})\b", re.IGNORECASE)
    
    # 16-digit Credit/Debit Card number
    CREDIT_CARD_REGEX = re.compile(r"\b(?:\d{4}[ -]?){3}(\d{4})\b")
    
    # 10-digit Phone Number (optional +91)
    PHONE_REGEX = re.compile(r"\b(?:\+91[ -]?)?([6-9]\d{5})(\d{4})\b")
    
    # Email Address
    EMAIL_REGEX = re.compile(r"\b([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b")

    @classmethod
    def sanitize(cls, text: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Sanitizes PII in the input text and returns:
        (sanitized_text, list_of_redacted_types)
        """
        if not text:
            return text, []

        redacted_log: List[Dict[str, str]] = []
        sanitized = text

        # 1. Mask Aadhaar: e.g. 2345-6789-0123 -> XXXX-XXXX-0123
        def _mask_aadhaar(match):
            last4 = match.group(3)
            redacted_log.append({"type": "AADHAAR_MASKED", "indicator": f"XXXX-XXXX-{last4}"})
            return f"XXXX-XXXX-{last4}"

        sanitized = cls.AADHAAR_REGEX.sub(_mask_aadhaar, sanitized)

        # 2. Mask PAN: e.g. ABCDE1234F -> XXXXX1234X
        def _mask_pan(match):
            digits = match.group(2)
            redacted_log.append({"type": "PAN_MASKED", "indicator": f"XXXXX{digits}X"})
            return f"XXXXX{digits}X"

        sanitized = cls.PAN_REGEX.sub(_mask_pan, sanitized)

        # 3. Mask Credit Cards: e.g. 1234-5678-9012-3456 -> XXXX-XXXX-XXXX-3456
        def _mask_card(match):
            last4 = match.group(1)
            redacted_log.append({"type": "CARD_MASKED", "indicator": f"XXXX-XXXX-XXXX-{last4}"})
            return f"XXXX-XXXX-XXXX-{last4}"

        sanitized = cls.CREDIT_CARD_REGEX.sub(_mask_card, sanitized)

        # 4. Mask Phone: e.g. +91 9876543210 -> +91-XXXXXX3210
        def _mask_phone(match):
            last4 = match.group(2)
            redacted_log.append({"type": "PHONE_MASKED", "indicator": f"XXXXXX{last4}"})
            return f"XXXXXX{last4}"

        sanitized = cls.PHONE_REGEX.sub(_mask_phone, sanitized)

        # 5. Mask Email: e.g. user@example.com -> u***@example.com
        def _mask_email(match):
            first_char = match.group(1)
            domain = match.group(2)
            redacted_log.append({"type": "EMAIL_MASKED", "indicator": f"{first_char}***@{domain}"})
            return f"{first_char}***@{domain}"

        sanitized = cls.EMAIL_REGEX.sub(_mask_email, sanitized)

        return sanitized, redacted_log
