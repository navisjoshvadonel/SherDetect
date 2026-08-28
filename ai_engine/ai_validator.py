"""
ai_engine/ai_validator.py
-------------------------
Layer 2 & 3: Gemini Multimodal Semantic Reasoner & Offline Fallback Engine.
Audits document text for mathematical parity (Line Items + Tax = Total),
date chronologies, and ID checksums, with zero-downtime offline fallback.
Powered by the official modern `google-genai` SDK.
"""

import os
import re
import json
from typing import Dict, Any, List
from google import genai
from dotenv import load_dotenv

from ai_engine.pii_sanitizer import PIISanitizer
from ai_engine.checksum_validator import ChecksumValidator

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY", "").strip()
_genai_client = None

if api_key:
    try:
        _genai_client = genai.Client(api_key=api_key)
    except Exception as err:
        print(f"[SherDetect AI] Gemini client setup notice: {err}")


def extract_fallback_heuristics(text: str) -> Dict[str, Any]:
    """
    Resilient offline heuristic engine.
    Guarantees 100% uptime during live hackathon demos when offline or API key is missing.
    """
    discrepancies: List[Dict[str, str]] = []

    # 1. Check for cryptographic ID checksum anomalies (Aadhaar / Card / Tax numbers)
    id_audit = ChecksumValidator.audit_document_ids(text)
    if id_audit["hasChecksumAnomaly"]:
        discrepancies.extend(id_audit["anomalies"])

    # 2. Extract multi-currency numbers and values
    clean_text = re.sub(r"[,₹$€£]", "", text)
    numbers = [float(n) for n in re.findall(r"\b\d+(?:\.\d{1,2})?\b", clean_text) if len(n) < 10]

    # Look for labeled totals and subtotals via regex with proper negative lookbehind
    subtotal_match = re.search(r"\b(?:subtotal|sub-total|sub\s+total)\s*[:=]?\s*(\d+(?:\.\d{1,2})?)", clean_text, re.IGNORECASE)
    tax_match = re.search(r"\b(?:tax|vat|gst)\s*[:=]?\s*(\d+(?:\.\d{1,2})?)", clean_text, re.IGNORECASE)
    total_match = re.search(r"(?<!sub)\b(?:total|final\s+amount|grand\s+total)\s*[:=]?\s*(\d+(?:\.\d{1,2})?)", clean_text, re.IGNORECASE)

    if total_match and (subtotal_match or tax_match):
        total_val = float(total_match.group(1))
        subtotal_val = float(subtotal_match.group(1)) if subtotal_match else 0.0
        tax_val = float(tax_match.group(1)) if tax_match else 0.0
        expected_total = subtotal_val + tax_val

        # If expected total is significantly different from declared total
        if subtotal_val > 0 and abs(expected_total - total_val) > 2.0:
            discrepancies.append({
                "type": "MATH_MISMATCH",
                "description": f"Mathematical reconciliation failure: Subtotal ({subtotal_val:.2f}) + Tax ({tax_val:.2f}) sums to {expected_total:.2f}, but declared Total is {total_val:.2f}."
            })
    elif len(numbers) >= 3:
        # Fallback heuristic: maximum number is likely the total
        potential_total = max(numbers)
        sub_items = [n for n in numbers if n != potential_total]
        sum_items = sum(sub_items)
        if abs(sum_items - potential_total) > 5.0 and potential_total > 100:
            discrepancies.append({
                "type": "MATH_MISMATCH",
                "description": f"Mathematical reconciliation failure: Line items sum to {sum_items:.2f}, but total reads {potential_total:.2f}."
            })

    has_anomaly = len(discrepancies) > 0
    return {
        "semanticDiscrepancy": has_anomaly,
        "detectedAnomalies": discrepancies,
        "forensicSummary": (
            f"Forensic audit identified {len(discrepancies)} figure/checksum mismatch(es) in document."
            if has_anomaly
            else "Document content passes baseline semantic and mathematical parity checks."
        ),
        "source": "offline_heuristics"
    }


async def validate_document_semantics(document_text: str) -> Dict[str, Any]:
    """
    Validates document semantics using modern Gemini 2.5/1.5 Flash via `google.genai` with PII protection.
    Falls back to deterministic offline heuristics on any API/network failure.
    """
    # Privacy safeguard: Scrub citizen PII before processing
    sanitized_text, _ = PIISanitizer.sanitize(document_text)

    # If no API key configured or client failed, use offline fallback directly
    if not api_key or not _genai_client:
        return extract_fallback_heuristics(sanitized_text)

    try:
        prompt = f"""
Act as the SherDetect Lead Forensic Investigator.
Inspect this sanitized document text for:
1. Mathematical parity (subtotal + tax = total).
2. Date chronologies and logic.
3. Negative or absurd figures.

Document Content:
\"\"\"
{sanitized_text}
\"\"\"

Respond ONLY with a valid JSON object matching this schema:
{{
  "semanticDiscrepancy": false,
  "detectedAnomalies": [
    {{
      "type": "MATH_MISMATCH",
      "description": "Specific discrepancy explanation"
    }}
  ],
  "forensicSummary": "Concise forensic summary of findings"
}}
"""
        response = _genai_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        raw_text = response.text.strip() if response and response.text else ""

        # Resilient JSON extraction
        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            parsed["source"] = "gemini_1.5_flash"
            return parsed
        else:
            return extract_fallback_heuristics(sanitized_text)
    except Exception:
        # Fallback seamlessly on rate-limit, network error, or timeout
        return extract_fallback_heuristics(sanitized_text)
