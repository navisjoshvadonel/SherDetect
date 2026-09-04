"""
backend/tests/test_chaos_resilience.py
---------------------------------------
Chaos & System Resilience Failure Testing Suite.

Verifies zero-downtime claims under severe degradation:
1. Gemini LLM API Failure / Timeout (Circuit Breaker OPEN fallback).
2. Supabase Database Disconnection / Outage.
3. Malicious Executable Payload / Magic Byte Tampering.
"""

import io
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app
from ai_engine.ai_validator import gemini_circuit_breaker

client = TestClient(app)


def test_chaos_gemini_api_timeout_circuit_breaker_fallback():
    """
    Simulates Gemini API timeout / 500 error.
    Verification: System MUST NOT fail with 500 Internal Server Error;
    Circuit breaker transitions to OPEN, returning deterministic fallback score.
    """
    # Force Gemini circuit breaker to OPEN state
    gemini_circuit_breaker.record_failure()
    gemini_circuit_breaker.record_failure()
    gemini_circuit_breaker.record_failure()
    assert gemini_circuit_breaker.allow_request() is False

    # Submit valid PDF under circuit breaker OPEN state
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    files = {"file": ("fallback_test.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    
    response = client.post("/api/verify-document", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"completed", "processing"}

    # Reset circuit breaker
    gemini_circuit_breaker.record_success()


def test_chaos_supabase_database_outage_resilience():
    """
    Simulates Supabase DB offline / unreachable state.
    Verification: Verification request completes normally (200 OK) with in-memory log fallback.
    """
    with patch("backend.app.main.supabase_client", None):
        pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
        files = {"file": ("supabase_offline.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        
        response = client.post("/api/verify-document", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in {"completed", "processing"}


def test_chaos_malicious_executable_magic_byte_rejection():
    """
    Simulates malicious executable payload disguised with .pdf file extension.
    Verification: Security Guard catches magic byte header mismatch and rejects with HTTP 400 or 415.
    """
    exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00" # Windows EXE header
    files = {"file": ("malware_disguised.pdf", io.BytesIO(exe_bytes), "application/pdf")}
    
    response = client.post("/api/verify-document", files=files)
    assert response.status_code in {400, 415}
    data = response.json()
    assert "Security Violation" in str(data) or "magic bytes" in str(data)
