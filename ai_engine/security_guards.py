"""
ai_engine/security_guards.py
----------------------------
Enterprise Security Guards & Vulnerability Prevention Module.

Includes:
1. Magic Byte Signature Sniffing & File Malware Guard.
2. Path Traversal & Filename Sanitization.
3. Sliding Window IP Rate Limiting & Anomaly Abuse Guard.
4. Enterprise HTTP Security Headers Middleware.
5. Strict CORS Origin Policy Enforcement.
"""

import os
import re
import time
from typing import Tuple, Dict, Set, Optional
from collections import defaultdict
from fastapi import Request, HTTPException, Response
from starlette.middleware.base import BaseHTTPMiddleware

# ── Magic Byte Signature Specifications ─────────────────────────────────────
MAGIC_SIGNATURES: Dict[str, Tuple[bytes, ...]] = {
    "jpeg": (b"\xFF\xD8\xFF",),
    "jpg": (b"\xFF\xD8\xFF",),
    "png": (b"\x89PNG\r\n\x1a\n",),
    "pdf": (b"%PDF-",),
}

DANGEROUS_EXTENSIONS: Set[str] = {
    ".exe", ".bat", ".cmd", ".sh", ".vbs", ".ps1", ".dll", ".so", ".dylib",
    ".js", ".jar", ".scr", ".pif", ".hta", ".cpl", ".msi", ".com", ".elf"
}

ALLOWED_MIME_TYPES: Set[str] = {
    "image/jpeg", "image/jpg", "image/png", "application/pdf",
    "application/octet-stream"
}

# ── 1. File Magic Signature Sniffing & Malware Guard ─────────────────────────
def validate_file_security(contents: bytes, filename: str, content_type: Optional[str] = None) -> str:
    """
    Validates file integrity, magic byte signatures, extension safety, and path safety.
    Prevents executable disguise attacks (e.g. shell script or EXE saved as .jpg/.pdf).
    """
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    # 1. Filename Sanitization & Path Traversal Check
    clean_filename = os.path.basename(filename).replace("\x00", "")
    if ".." in clean_filename or "/" in clean_filename or "\\" in clean_filename:
        raise HTTPException(status_code=400, detail="Invalid filename or path traversal detected.")

    ext = os.path.splitext(clean_filename)[1].lower()
    if ext in DANGEROUS_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Security Violation: File extension '{ext}' is explicitly prohibited."
        )

    # 2. Content-Type Check
    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. Allowed: JPEG, PNG, PDF."
        )

    # 3. Magic Byte Sniffing Verification
    is_valid_magic = False
    detected_format = None

    for fmt, sigs in MAGIC_SIGNATURES.items():
        for sig in sigs:
            if contents.startswith(sig):
                is_valid_magic = True
                detected_format = fmt
                break
        if is_valid_magic:
            break

    if not is_valid_magic:
        raise HTTPException(
            status_code=415,
            detail="Security Violation: File header magic bytes do not match an allowed format (JPEG, PNG, PDF). Disguised payloads rejected."
        )

    # Cross-verify extension vs magic bytes
    if ext in [".jpg", ".jpeg"] and detected_format not in ["jpg", "jpeg"]:
        raise HTTPException(status_code=415, detail="Extension mismatch: File extension claims JPEG but binary magic header differs.")
    elif ext == ".png" and detected_format != "png":
        raise HTTPException(status_code=415, detail="Extension mismatch: File extension claims PNG but binary magic header differs.")
    elif ext == ".pdf" and detected_format != "pdf":
        raise HTTPException(status_code=415, detail="Extension mismatch: File extension claims PDF but binary magic header differs.")

    return clean_filename


# ── 2. Sliding Window IP Rate Limiter & Abuse Guard ─────────────────────────
class IPRateLimiter:
    """
    In-memory sliding window rate limiter to prevent API abuse and evasion probing.
    """
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.client_records: Dict[str, list] = defaultdict(list)

    def check_rate_limit(self, client_ip: str):
        now = time.time()
        window_start = now - 60.0

        # Clean old records
        self.client_records[client_ip] = [
            t for t in self.client_records[client_ip] if t > window_start
        ]

        if len(self.client_records[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded: Too many verification requests. Please try again in 1 minute."
            )

        self.client_records[client_ip].append(now)

rate_limiter = IPRateLimiter(requests_per_minute=30)


# ── 3. Enterprise HTTP Security Headers Middleware ─────────────────────────
class EnterpriseSecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends mandatory enterprise HTTP security headers to all incoming responses.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


# ── 4. Strict CORS Origin Parser ────────────────────────────────────────────
def parse_strict_cors_origins(raw_origins: str) -> list:
    """
    Parses ALLOWED_ORIGINS string and explicitly rejects wildcard origins in non-development.
    """
    origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    cleaned = []
    for origin in origins:
        if origin == "*":
            # Wildcard rejected for security
            continue
        cleaned.append(origin)
    
    if not cleaned:
        # Fallback to local dev defaults if empty
        cleaned = ["http://localhost:3000", "http://127.0.0.1:3000"]
    return cleaned
