import pytest
from fastapi import HTTPException
from ai_engine.security_guards import (
    validate_file_security,
    IPRateLimiter,
    parse_strict_cors_origins
)

def test_valid_jpeg_magic_bytes():
    jpeg_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    cleaned_filename = validate_file_security(jpeg_bytes, "valid_sample.jpg", "image/jpeg")
    assert cleaned_filename == "valid_sample.jpg"

def test_valid_png_magic_bytes():
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    cleaned_filename = validate_file_security(png_bytes, "valid_sample.png", "image/png")
    assert cleaned_filename == "valid_sample.png"

def test_valid_pdf_magic_bytes():
    pdf_bytes = b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n"
    cleaned_filename = validate_file_security(pdf_bytes, "document.pdf", "application/pdf")
    assert cleaned_filename == "document.pdf"

def test_reject_executable_disguised_as_pdf():
    # Executable MZ header disguised as PDF
    exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff"
    with pytest.raises(HTTPException) as exc_info:
        validate_file_security(exe_bytes, "malicious.pdf", "application/pdf")
    assert exc_info.value.status_code == 415
    assert "magic bytes do not match" in exc_info.value.detail.lower()

def test_reject_dangerous_extension():
    sh_bytes = b"#!/bin/bash\necho hack"
    with pytest.raises(HTTPException) as exc_info:
        validate_file_security(sh_bytes, "script.sh", "text/plain")
    assert exc_info.value.status_code == 415

def test_reject_path_traversal_filename():
    jpeg_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF"
    cleaned = validate_file_security(jpeg_bytes, "../../../etc/passwd.jpg", "image/jpeg")
    assert cleaned == "passwd.jpg"
    assert ".." not in cleaned

def test_rate_limiter_exceeded():
    limiter = IPRateLimiter(requests_per_minute=3)
    client_ip = "192.168.1.100"
    limiter.check_rate_limit(client_ip)
    limiter.check_rate_limit(client_ip)
    limiter.check_rate_limit(client_ip)
    with pytest.raises(HTTPException) as exc_info:
        limiter.check_rate_limit(client_ip)
    assert exc_info.value.status_code == 429

def test_strict_cors_origins_parsing():
    origins = parse_strict_cors_origins("*,http://localhost:3000,http://127.0.0.1:3000")
    assert "*" not in origins
    assert "http://localhost:3000" in origins
