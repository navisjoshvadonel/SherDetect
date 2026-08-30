"""
backend/app/main.py
-------------------
SherDetect Backend API — FastAPI application server.
Roles:
  - Receives multipart file uploads from the Next.js frontend.
  - Orchestrates the 6-layer AI forensic pipeline from ai_engine/.
  - Persists every forensic audit report to Supabase (PostgreSQL) for
    cross-session history, compliance audit trails, and dashboard analytics.
  - Returns a strictly typed ForensicReport (contracts/api_spec.py).

Supabase Table Required (run in Supabase SQL editor):
  CREATE TABLE audit_reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id   TEXT NOT NULL,
    file_name     TEXT NOT NULL,
    is_authentic  BOOLEAN NOT NULL,
    verdict       TEXT NOT NULL,
    fraud_risk_score FLOAT NOT NULL,
    ela_score     FLOAT NOT NULL,
    metadata_tampered BOOLEAN NOT NULL,
    software_detected TEXT,
    semantic_discrepancy BOOLEAN NOT NULL,
    forensic_summary TEXT NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  );
"""

import sys
import os
import time
import uuid
import hashlib
import httpx
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# ── Path resolution: allow cross-role imports from project root ───────────────
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from pydantic import BaseModel, Field
from contracts.api_spec import (
    ForensicReport, ForensicBreakdown, AnomalyBoundingBox
)

# ── Supabase Client (graceful fallback if not configured) ─────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
supabase_client = None

if SUPABASE_URL and SUPABASE_ANON_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("[SherDetect] [OK] Supabase connected.")
    except Exception as e:
        print(f"[SherDetect] [WARN] Supabase init failed (offline mode): {e}")
else:
    print("[SherDetect] [INFO] Supabase not configured - audit persistence disabled.")

# ── FastAPI Application ───────────────────────────────────────────────────────
app = FastAPI(
    title="SherDetect Forensics Backend API",
    version="2.0.0",
    description=(
        "Full-stack AI document forgery detection engine. "
        "Integrates 6-layer forensic pipeline (ELA, Metadata EXIF, "
        "Sharpness, Benford, Checksums, Gemini LLM) with Supabase persistence."
    ),
)

# ── Security & CORS Configuration ─────────────────────────────────────────────
ALLOWED_ORIGINS_ENV = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/jpg",
    "application/pdf",
    "application/octet-stream",  # Some clients send this for PDF
}
MAX_FILE_SIZE_MB = 50


# ── Helper: Persist to Supabase ───────────────────────────────────────────────
def _persist_to_supabase(report: ForensicReport, file_name: str, file_hash: str) -> bool:
    """
    Saves the forensic audit record to Supabase.
    Writes to:
      - audit_reports  : Full forensic result record
      - audit_trail    : Immutable action log entry
    """
    if not supabase_client:
        return False
    try:
        # Write to audit_reports
        supabase_client.table("audit_reports").insert({
            "document_id": report.documentId,
            "file_name": file_name,
            "is_authentic": report.isAuthentic,
            "verdict": report.verdict,
            "fraud_risk_score": report.fraudRiskScore,
            "ela_score": report.forensicBreakdown.elaScore,
            "metadata_tampered": report.forensicBreakdown.metadataTampered,
            "software_detected": report.forensicBreakdown.softwareFingerprintDetected,
            "semantic_discrepancy": report.forensicBreakdown.semanticDiscrepancy,
            "forensic_summary": report.forensicSummary,
            "processing_time_ms": report.processingTimeMs,
            "anomaly_count": len(report.detectedAnomalies),
            "file_hash": file_hash,
            "full_report_json": report.model_dump(mode="json") if hasattr(report, "model_dump") else report.dict(),
        }).execute()

        # Write to audit_trail (immutable event log)
        action = "verified" if report.isAuthentic else "rejected"
        supabase_client.table("audit_trail").insert({
            "doc_id": report.documentId,
            "action": action,
            "actor": "SherDetect AI Engine",
            "note": f"{report.verdict} | Risk Score: {report.fraudRiskScore}% | {report.forensicSummary[:120]}",
        }).execute()

        return True
    except Exception as e:
        print(f"[SherDetect] Supabase write failed: {e}")
        return False


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check — confirms server status and Supabase connectivity."""
    return {
        "status": "online",
        "service": "SherDetect Forensic Backend API",
        "version": "2.0.0",
        "supabase": "connected" if supabase_client else "not_configured",
    }


@app.post("/api/verify-document", response_model=ForensicReport)
async def verify_document(file: UploadFile = File(...)):
    """
    Primary forensic verification endpoint.

    Accepts a multipart file upload (JPG / PNG / PDF up to 50 MB).
    Runs the full 6-layer forensic pipeline and persists results to Supabase.
    Returns a ForensicReport strictly matching contracts/api_spec.py.
    """
    start_time = time.time()

    # ── Validate content type ─────────────────────────────────────────────────
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, PDF.",
        )

    # ── Validate file size BEFORE reading full payload into memory ───────────
    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

    # 1. Immediate rejection via Content-Length header if present
    content_length = file.headers.get("content-length")
    if content_length and content_length.isdigit():
        if int(content_length) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed limit of {MAX_FILE_SIZE_MB} MB.",
            )

    # 2. Chunked streaming read with byte quota guard to prevent memory-exhaustion abuse
    byte_chunks = []
    total_bytes = 0
    chunk_size = 1024 * 1024  # 1 MB chunks

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed limit of {MAX_FILE_SIZE_MB} MB.",
            )
        byte_chunks.append(chunk)

    contents = b"".join(byte_chunks)
    file_name = file.filename or "uploaded_document.bin"
    
    # ── Phase 1.2: File Hashing & Deduplication (Caching) ───────────────
    file_hash = hashlib.sha256(contents).hexdigest()

    if supabase_client:
        try:
            cached = supabase_client.table("audit_reports").select("full_report_json").eq("file_hash", file_hash).limit(1).execute()
            if cached.data and cached.data[0].get("full_report_json"):
                print(f"[SherDetect] Cache hit for {file_name} ({file_hash})")
                return ForensicReport(**cached.data[0]["full_report_json"])
        except Exception as e:
            print(f"[SherDetect] Cache check failed: {e}")

    try:
        # ── Phase 1.1: Forward to AI Engine Microservice ─────────────────
        ai_engine_url = os.getenv("AI_ENGINE_URL", "http://localhost:8000/api/verify-document")
        
        async with httpx.AsyncClient() as client:
            files_payload = {"file": (file_name, contents, file.content_type or "application/octet-stream")}
            response = await client.post(ai_engine_url, files=files_payload, timeout=120.0)
            
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"AI Engine failed: {response.text}")
            
        report_data = response.json()
        report = ForensicReport(**report_data)

        # ── Persist to Supabase ────────────────────────────────────────────────
        _persist_to_supabase(report, file_name, file_hash)

        return report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensic analysis failed: {str(e)}")


class DecisionRequest(BaseModel):
    decision: str = Field(..., description="verified | rejected | resubmit")
    notes: Optional[str] = ""
    reviewerName: Optional[str] = "Verifier Officer"


@app.get("/api/audit-history")
def get_audit_history(
    limit: int = Query(default=20, ge=1, le=100),
    verdict: Optional[str] = Query(default=None),
):
    """
    Retrieves persisted audit history from Supabase.
    Optionally filter by verdict: VERIFIED_AUTHENTIC | SUSPICIOUS | FORGERY_DETECTED.
    Returns empty list if Supabase is not configured.
    """
    if not supabase_client:
        return {"records": [], "supabase": "not_configured"}
    try:
        query = supabase_client.table("audit_reports").select("*").order(
            "created_at", desc=True
        ).limit(limit)
        if verdict:
            query = query.eq("verdict", verdict)
        result = query.execute()
        return {"records": result.data, "total": len(result.data)}
    except Exception as e:
        print(f"[SherDetect] Supabase audit fetch offline/unreachable: {e}")
        return {"records": [], "supabase": "offline", "error": str(e)}


@app.post("/api/documents/{doc_id}/decision")
def record_decision(doc_id: str, payload: DecisionRequest):
    """
    Records a reviewer officer verification decision in Supabase/audit trail.
    """
    action = payload.decision
    note = payload.notes or f"Marked as {payload.decision} by {payload.reviewerName}"

    if supabase_client:
        try:
            supabase_client.table("audit_trail").insert({
                "doc_id": doc_id,
                "action": action,
                "actor": payload.reviewerName,
                "note": note,
            }).execute()
        except Exception as e:
            print(f"[SherDetect] Supabase decision log error: {e}")

    return {
        "status": "success",
        "doc_id": doc_id,
        "decision": action,
        "reviewer": payload.reviewerName,
        "note": note,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
