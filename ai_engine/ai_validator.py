"""
ai_engine/ai_validator.py
-------------------------
Layer 2 & 3: Gemini Multimodal Semantic Reasoner & Offline Fallback Engine.
Audits document text for mathematical parity (Line Items + Tax = Total),
date chronologies, ID checksums, typos, signatory plausibility, and template
markers, with zero-downtime offline fallback.
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
from ai_engine.logger import setup_logger

logger = setup_logger("SherDetect.AIValidator")

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY", "").strip()
_genai_client = None

if api_key:
    try:
        _genai_client = genai.Client(api_key=api_key)
    except Exception as err:
        logger.error(f"Gemini client setup notice: {err}")


# ---------------------------------------------------------------------------
# Common certificate / document keywords and their known misspellings.
# Each entry maps a *correct* keyword to a regex that catches frequent typos.
# The regex must NOT match the correct spelling itself.
# ---------------------------------------------------------------------------
_TYPO_PATTERNS: List[tuple] = [
    ("Certificate", re.compile(r"\b(?:Certif[i]?c[ai]te|Cert[i]?ficate|Certifcate|Certiifcate)\b", re.I)),
    ("Completion", re.compile(r"\b(?:Completi[oi]n|Complet[io]n|Compl[ei]tion)\b", re.I)),
    ("Authorized", re.compile(r"\b(?:Autho[ri]zed|Athourized|Autorized|Authrized)\b", re.I)),
    ("Analyze", re.compile(r"\b(?:Anafyze|Analyz|Anaylze|Analize)\b", re.I)),
    ("Achievement", re.compile(r"\b(?:Acheivement|Acheivment|Achievment|Achivement)\b", re.I)),
    ("Professional", re.compile(r"\b(?:Proffesional|Profesional|Proffessional|Professsional)\b", re.I)),
    ("University", re.compile(r"\b(?:Univeristy|Univercity|Univesity|Unversity)\b", re.I)),
    ("Education", re.compile(r"\b(?:Eduction|Educaton|Educaiton|Edcuation)\b", re.I)),
    ("Management", re.compile(r"\b(?:Managment|Managemnt|Manegement|Mangement)\b", re.I)),
    ("Technology", re.compile(r"\b(?:Technolgy|Tecnology|Techonlogy|Techology)\b", re.I)),
    ("Development", re.compile(r"\b(?:Developement|Devlopment|Develpoment|Develpment)\b", re.I)),
    ("Engineering", re.compile(r"\b(?:Enginnering|Enginering|Enginneering|Engieering)\b", re.I)),
    ("Verification", re.compile(r"\b(?:Verfication|Verifcation|Veriifcation|Verificaton)\b", re.I)),
    ("Congratulations", re.compile(r"\b(?:Congradulations|Congrats|Congradulation|Congratualtion)\b", re.I)),
    ("Successfully", re.compile(r"\b(?:Succesfully|Successfuly|Sucessfully|Succefully)\b", re.I)),
    ("Registered", re.compile(r"\b(?:Registred|Resgistered|Registerd|Regsitered)\b", re.I)),
    ("Coursera", re.compile(r"\b(?:Coursra|Cousera|Courcera|Corsera)\b", re.I)),
    ("Credential", re.compile(r"\b(?:Credantial|Credentail|Credetnial|Crendential)\b", re.I)),
]

# Correct spellings for the positive-match check (document must contain real
# keywords to earn the "has evidence" bonus).
_VALID_CERT_KEYWORDS = re.compile(
    r"\b(?:Certificate|Completion|Authorized|Achievement|Credential|Verify|Issued|Signature|Awarded)\b",
    re.I,
)

# Template / placeholder markers that indicate a forged or blank template.
_TEMPLATE_MARKERS = re.compile(
    r"(?:\bYour\s+Name\s+Here\b|\[INSERT\s+NAME\]|\[NAME\]|\bLorem\s+Ipsum\b|\bSAMPLE\s+ONLY\b"
    r"|\bXX+/XX+/\d{4}\b|\bXXXX-XXXX\b|\bplaceholder\b|\btemplate\s+only\b)",
    re.I,
)

# Suspicious signatory patterns: high-level titles on entry-level certs.
_SUSPICIOUS_SIGNATORIES = re.compile(
    r"\b(?:Chief\s+Legal\s+Officer|General\s+Counsel|Chief\s+Financial\s+Officer"
    r"|Chief\s+Executive\s+Officer|Board\s+of\s+Directors)\b",
    re.I,
)
_ENTRY_LEVEL_INDICATORS = re.compile(
    r"\b(?:Introduction\s+to|Beginner|Fundamentals|Getting\s+Started|Basics\s+of"
    r"|Entry[\s-]Level|101)\b",
    re.I,
)


def _check_typos(text: str) -> List[Dict[str, str]]:
    """Scan extracted text for known certificate-keyword misspellings."""
    found: List[Dict[str, str]] = []
    for correct_word, pattern in _TYPO_PATTERNS:
        matches = pattern.findall(text)
        for m in matches:
            # Only flag if the match is NOT the correct spelling
            if m.lower() != correct_word.lower():
                found.append({
                    "type": "CONTENT_TYPO",
                    "description": f"Spelling error detected: '{m}' (expected '{correct_word}'). "
                                   f"Official issuers do not allow spelling errors on certificates."
                })
    return found


def _check_template_markers(text: str) -> List[Dict[str, str]]:
    """Detect placeholder / template markers in document text."""
    found: List[Dict[str, str]] = []
    matches = _TEMPLATE_MARKERS.findall(text)
    for m in matches:
        found.append({
            "type": "TEMPLATE_MARKER",
            "description": f"Generic template marker detected: '{m}'. "
                           f"This indicates the document is a blank template, not an issued certificate."
        })
    return found


def _check_signatory_plausibility(text: str) -> List[Dict[str, str]]:
    """Flag implausible signatory titles on entry-level certificates."""
    found: List[Dict[str, str]] = []
    if _SUSPICIOUS_SIGNATORIES.search(text) and _ENTRY_LEVEL_INDICATORS.search(text):
        found.append({
            "type": "SIGNATORY_IMPLAUSIBILITY",
            "description": "High-level executive title (e.g. Chief Legal Officer) found signing "
                           "an entry-level or introductory certificate. This is inconsistent with "
                           "standard issuing authority hierarchies."
        })
    return found


def extract_fallback_heuristics(text: str, file_format: str = "unknown") -> Dict[str, Any]:
    """
    Resilient offline heuristic engine.
    Guarantees 100% uptime during live hackathon demos when offline or API key is missing.

    Performs content-first analysis:
    1. Checksum validation (Aadhaar / card IDs)
    2. Mathematical parity (Subtotal + Tax = Total)
    3. Typo detection in certificate keywords
    4. Template / placeholder marker detection
    5. Signatory plausibility check
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

    # 3. Content-based typo detection
    typo_findings = _check_typos(text)
    discrepancies.extend(typo_findings)

    # 4. Template / placeholder detection
    template_findings = _check_template_markers(text)
    discrepancies.extend(template_findings)

    # 5. Signatory plausibility check
    signatory_findings = _check_signatory_plausibility(text)
    discrepancies.extend(signatory_findings)

    has_anomaly = len(discrepancies) > 0
    has_document_evidence = text.strip() and not text.startswith("No machine-readable")
    has_valid_keywords = bool(_VALID_CERT_KEYWORDS.search(text)) if has_document_evidence else False

    # Build detailed text content analysis summary
    analysis_parts: List[str] = []
    if typo_findings:
        analysis_parts.append(f"Found {len(typo_findings)} spelling error(s) in certificate keywords")
    if template_findings:
        analysis_parts.append(f"Found {len(template_findings)} template/placeholder marker(s)")
    if signatory_findings:
        analysis_parts.append(f"Signatory title is implausible for the certificate level")
    if id_audit["hasChecksumAnomaly"]:
        analysis_parts.append(f"Found {len(id_audit['anomalies'])} ID checksum failure(s)")
    math_discrepancies = [d for d in discrepancies if d["type"] == "MATH_MISMATCH"]
    if math_discrepancies:
        analysis_parts.append("Mathematical parity check failed")
    if not analysis_parts:
        if has_valid_keywords:
            analysis_parts.append("All extracted content checks passed (typos, signatories, templates, checksums)")
        else:
            analysis_parts.append("Deterministic checks completed; no certificate keywords detected for deep validation")

    text_analysis = "; ".join(analysis_parts) + "."

    # Confidence calibration based on content evidence strength
    if has_anomaly:
        confidence = 0.9
    elif has_valid_keywords:
        # Document has real certificate keywords and passed all content checks
        confidence = 0.65
    elif has_document_evidence:
        confidence = 0.50
    else:
        confidence = 0.0

    return {
        "semanticDiscrepancy": has_anomaly,
        "detectedAnomalies": discrepancies,
        "forensicSummary": (
            f"Forensic audit identified {len(discrepancies)} content anomali(es) in document: {text_analysis}"
            if has_anomaly
            else "Document content passes baseline semantic, spelling, and mathematical parity checks."
        ),
        "source": "offline_heuristics",
        "file_format_observed": file_format,
        "format_bias_mitigation": "File quality and format were ignored; only extracted content and deterministic checks were evaluated.",
        "text_content_analysis": text_analysis,
        "confidence_score": confidence,
        "final_classification": "Forgery" if has_anomaly else ("Genuine" if has_document_evidence else "Unverifiable")
    }


async def validate_document_semantics(
    document_text: str,
    file_format: str = "unknown",
    document_bytes: bytes | None = None,
) -> Dict[str, Any]:
    """
    Validates document semantics using modern Gemini 2.5/1.5 Flash via `google.genai` with PII protection.
    Falls back to deterministic offline heuristics on any API/network failure.
    """
    # Privacy safeguard: Scrub citizen PII before processing
    sanitized_text, _ = PIISanitizer.sanitize(document_text)

    # If no API key configured or client failed, use offline fallback directly
    if not api_key or not _genai_client:
        return extract_fallback_heuristics(sanitized_text, file_format)

    try:
        prompt = f"""
    Act as a document classification AI specializing in certificate fraud.
    The observed file format is {file_format}, but format, resolution, compression,
    lighting, and vector cleanliness are NEVER evidence of authenticity.

    Actively reverse format bias:
    - A noisy or compressed JPG can be genuine. Judge its extracted words, issuer,
      signatory, branding, course facts, and verification path.
    - A pristine PDF can be forged. A typo, wrong signatory, generic seal, missing
      authorized platform, or invalid credential path is a serious red flag.
    - IF the image contains AI generation artifacts (e.g., hallucinated/garbled background text, nonsensical objects, distorted logos, or AI watermarks like a 4-pointed star in the corner), it is a FORGERY. AI-generated certificates are ALWAYS fakes.

    Audit in this order:
    1. Check every extracted word for spelling and phrasing errors.
    2. Check for AI generation artifacts (hallucinated text in backgrounds, weird logos, watermarks).
    3. Check signatory authority against the issuing division.
    4. Check official partnership/platform branding and logo anomalies.
    5. Check credential IDs and direct verification URLs.
    6. Check mathematical parity, dates, and absurd figures where applicable.

Document Content:
\"\"\"
{sanitized_text}
\"\"\"

Respond ONLY with a valid JSON object matching this schema:
{{
    "file_format_observed": "clean PDF or noisy JPG",
    "format_bias_mitigation": "Explain that file quality was ignored",
    "text_content_analysis": "List typos, AI artifacts, signatory, branding, and factual findings",
    "final_classification": "Genuine or Forgery",
    "confidence_score": 0.0,
  "semanticDiscrepancy": false,
  "detectedAnomalies": [
    {{
      "type": "AI_ARTIFACT",
      "description": "Specific discrepancy explanation",
      "x": 85.0,
      "y": 90.0,
      "width": 10.0,
      "height": 10.0
    }}
  ],
  "forensicSummary": "Concise forensic summary of findings"
}}
"""
        contents: Any = prompt
        if document_bytes and file_format in {"image/jpeg", "image/png", "application/pdf"}:
            contents = [
                prompt,
                genai.types.Part.from_bytes(data=document_bytes, mime_type=file_format),
            ]
        response = _genai_client.models.generate_content(model="gemini-1.5-flash", contents=contents)
        raw_text = response.text.strip() if response and response.text else ""

        # Resilient JSON extraction
        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            parsed["source"] = "gemini_1.5_flash"
            parsed.setdefault("file_format_observed", file_format)
            parsed.setdefault("format_bias_mitigation", "File quality and format were ignored; content and issuer evidence were prioritized.")
            parsed.setdefault("text_content_analysis", parsed.get("forensicSummary", "No additional textual findings were returned."))
            parsed.setdefault("final_classification", "Forgery" if parsed.get("semanticDiscrepancy") else "Unverifiable")
            parsed.setdefault("confidence_score", 0.0)
            return parsed
        else:
            return extract_fallback_heuristics(sanitized_text, file_format)
    except Exception:
        # Fallback seamlessly on rate-limit, network error, or timeout
        return extract_fallback_heuristics(sanitized_text, file_format)
