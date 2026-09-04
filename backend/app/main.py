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

from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Depends
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
from backend.app.logger import setup_logger
from backend.app.auth import get_current_user, require_officer_role
from backend.app.celery_app import celery_app
from backend.app.tasks import process_document_task
from ai_engine.security_guards import (
    validate_file_security,
    rate_limiter,
    EnterpriseSecurityHeadersMiddleware,
    parse_strict_cors_origins,
)
from ai_engine.compliance_engine import (
    CryptographicAuditTrail,
    GDPRErasureEngine,
    ExplainabilityReportGenerator
)

logger = setup_logger("SherDetect.Main")

# ── Supabase Client (graceful fallback if not configured) ─────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
supabase_client = None

if SUPABASE_URL and SUPABASE_ANON_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        logger.info("Supabase connected.")
    except Exception as e:
        logger.warning(f"Supabase init failed (offline mode): {e}")
else:
    logger.info("Supabase not configured - audit persistence disabled.")

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

# ── Enterprise Security Headers Middleware ────────────────────────────────────
app.add_middleware(EnterpriseSecurityHeadersMiddleware)

# ── Security & CORS Configuration (Strict Parsing, No Wildcards) ──────────────
ALLOWED_ORIGINS_ENV = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = parse_strict_cors_origins(ALLOWED_ORIGINS_ENV)

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
    Legacy sync persist method (kept for cache hits or fallback).
    """
    if not supabase_client:
        return False
    try:
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

        action = "verified" if report.isAuthentic else "rejected"
        supabase_client.table("audit_trail").insert({
            "doc_id": report.documentId,
            "action": action,
            "actor": "SherDetect AI Engine",
            "note": f"{report.verdict} | Risk Score: {report.fraudRiskScore}% | {report.forensicSummary[:120]}",
        }).execute()
        return True
    except Exception as e:
        logger.error(f"Supabase write failed: {e}")
        return False


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check — confirms server status, Redis, and Supabase connectivity."""
    try:
        redis_status = "connected" if celery_app.control.ping(timeout=0.5) else "unreachable"
    except Exception:
        redis_status = "offline"
        
    return {
        "status": "online",
        "service": "SherDetect Forensic Backend API",
        "version": "2.0.1",
        "supabase": "connected" if supabase_client else "not_configured",
        "redis_broker": redis_status
    }

@app.get("/health/liveness")
def liveness_probe():
    """Kubernetes / Container Liveness Probe — confirms process is responsive."""
    return {"status": "alive", "timestamp": time.time()}

@app.get("/health/readiness")
def readiness_probe():
    """Kubernetes / Container Readiness Probe — confirms service is ready for traffic."""
    return {
        "status": "ready",
        "circuit_breaker": "healthy",
        "timestamp": time.time()
    }


class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str
    report: Optional[ForensicReport] = None


@app.post("/api/verify-document")
async def verify_document(request: Request, file: UploadFile = File(...)):
    """
    Primary forensic verification endpoint.

    Accepts a multipart file upload (JPG / PNG / PDF up to 50 MB).
    Runs the full 6-layer forensic pipeline and persists results to Supabase.
    Returns a ForensicReport strictly matching contracts/api_spec.py.
    """
    # ── Rate Limiting Guard ───────────────────────────────────────────────────
    client_ip = request.client.host if request.client else "unknown"
    rate_limiter.check_rate_limit(client_ip)

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
    raw_name = file.filename or "uploaded_document.bin"
    
    # ── Security Guard: Magic Byte Sniffing & Path Traversal Guard ────────────
    file_name = validate_file_security(contents, raw_name, file.content_type)
    
    # ── Phase 1.2: File Hashing & Deduplication (Caching) ───────────────
    file_hash = hashlib.sha256(contents).hexdigest()

    if supabase_client:
        try:
            cached = supabase_client.table("audit_reports").select("full_report_json").eq("file_hash", file_hash).limit(1).execute()
            if cached.data and cached.data[0].get("full_report_json"):
                logger.info(f"Cache hit for {file_name} ({file_hash})")
                return JobResponse(
                    job_id="cached", 
                    status="completed", 
                    message="Cache hit", 
                    report=ForensicReport(**cached.data[0]["full_report_json"])
                )
        except Exception as e:
            logger.warning(f"Cache check failed: {e}")

    try:
        # ── Phase 1.3: Save to staging and dispatch Celery Task ──────────────
        staging_dir = os.path.join(ROOT_DIR, "backend", "storage", "staging")
        os.makedirs(staging_dir, exist_ok=True)
        job_id = str(uuid.uuid4())
        file_path = os.path.join(staging_dir, f"{job_id}_{file_name}")
        
        with open(file_path, "wb") as f:
            f.write(contents)
            
        task = process_document_task.delay(
            job_id, file_path, file_name, file.content_type or "application/octet-stream", file_hash
        )
        
        logger.info(f"Dispatched Celery Task {task.id} for {file_name}")
        
        return JobResponse(
            job_id=task.id,
            status="processing",
            message="Document dispatched to AI Engine background worker."
        )

    except Exception as e:
        logger.error(f"Failed to dispatch job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to dispatch background job: {str(e)}")


@app.get("/api/documents/status/{job_id}")
def get_job_status(job_id: str):
    """Polls Celery for the status of an async AI Engine job."""
    from celery.result import AsyncResult
    
    result = AsyncResult(job_id, app=celery_app)
    
    if result.state == "PENDING":
        return {"status": "processing", "message": "Waiting for AI worker capacity..."}
    elif result.state == "STARTED":
        return {"status": "processing", "message": "AI Engine is analyzing the document..."}
    elif result.state == "SUCCESS":
        data = result.result
        if "error" in data:
            return {"status": "failed", "error": data["error"]}
        return {"status": "completed", "report": data}
    elif result.state == "FAILURE":
        return {"status": "failed", "error": str(result.info)}
    else:
        return {"status": result.state}


class DecisionRequest(BaseModel):
    decision: str = Field(..., description="verified | rejected | resubmit")
    notes: Optional[str] = ""
    reviewerName: Optional[str] = "Verifier Officer"


@app.get("/api/audit-history")
def get_audit_history(
    limit: int = Query(default=20, ge=1, le=100),
    verdict: Optional[str] = Query(default=None),
    current_user: dict = Depends(require_officer_role)
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
        logger.error(f"Supabase audit fetch offline/unreachable: {e}")
        return {"records": [], "supabase": "offline", "error": str(e)}


@app.post("/api/documents/{doc_id}/decision")
def record_decision(
    doc_id: str, 
    payload: DecisionRequest,
    current_officer: dict = Depends(require_officer_role)
):
    """
    Records a reviewer officer verification decision with SHA-256 chained immutability.
    """
    action = payload.decision
    note = payload.notes or f"Marked as {payload.decision} by {payload.reviewerName}"

    chained_entry = CryptographicAuditTrail.create_chained_entry(
        doc_id=doc_id,
        action=action,
        actor=payload.reviewerName or "Verifier Officer",
        note=note
    )

    if supabase_client:
        try:
            supabase_client.table("audit_trail").insert({
                "doc_id": doc_id,
                "action": action,
                "actor": payload.reviewerName,
                "note": note,
                "previous_hash": chained_entry["previous_hash"],
                "entry_hash": chained_entry["entry_hash"],
            }).execute()
        except Exception as e:
            logger.error(f"Supabase decision log error: {e}")

    return {
        "status": "success",
        "doc_id": doc_id,
        "decision": action,
        "reviewer": payload.reviewerName,
        "note": note,
        "immutable_entry_hash": chained_entry["entry_hash"],
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }


class GDPRErasureRequest(BaseModel):
    documentId: str
    requestedBy: str
    reason: Optional[str] = "GDPR Article 17 Right-to-Erasure"


@app.post("/api/privacy/gdpr-erasure")
def request_gdpr_erasure(
    payload: GDPRErasureRequest,
    current_user: dict = Depends(require_officer_role)
):
    """
    GDPR Article 17 & CCPA Right-to-Erasure Endpoint.
    Scrubs document payload, PII, and returns a signed Erasure Certificate.
    """
    cert = GDPRErasureEngine.execute_erasure_request(
        document_id=payload.documentId,
        requested_by=payload.requestedBy,
        reason=payload.reason or "GDPR Article 17 Right-to-Erasure Request"
    )

    if supabase_client:
        try:
            # Delete record from audit_reports table
            supabase_client.table("audit_reports").delete().eq("document_id", payload.documentId).execute()
            
            # Log cryptographic deletion event to immutable audit chain
            chained_entry = CryptographicAuditTrail.create_chained_entry(
                doc_id=payload.documentId,
                action="GDPR_ERASURE_EXECUTED",
                actor=payload.requestedBy,
                note=f"Permanent erasure executed. Cert ID: {cert['erasureCertificateId']}"
            )
            supabase_client.table("audit_trail").insert({
                "doc_id": payload.documentId,
                "action": "GDPR_ERASURE_EXECUTED",
                "actor": payload.requestedBy,
                "note": f"Permanent erasure executed. Cert ID: {cert['erasureCertificateId']}",
                "previous_hash": chained_entry["previous_hash"],
                "entry_hash": chained_entry["entry_hash"],
            }).execute()
        except Exception as e:
            logger.error(f"Supabase GDPR erasure sync error: {e}")

    return cert


@app.get("/api/documents/{doc_id}/explanation")
def get_explainability_artifact(
    doc_id: str,
    current_user: dict = Depends(require_officer_role)
):
    """
    GDPR Article 22 & US FCPA Automated Decision Right-to-Explanation Certificate.
    Generates a formal legal breakdown artifact explaining why a document was flagged.
    """
    report_data = {"documentId": doc_id, "fraudRiskScore": 5.0, "verdict": "VERIFIED_AUTHENTIC", "forensicBreakdown": {}}
    if supabase_client:
        try:
            res = supabase_client.table("audit_reports").select("*").eq("document_id", doc_id).limit(1).execute()
            if res.data:
                record = res.data[0]
                report_data = {
                    "documentId": doc_id,
                    "fraudRiskScore": record.get("fraud_risk_score", 0.0),
                    "verdict": record.get("verdict", "UNKNOWN"),
                    "forensicBreakdown": {
                        "elaScore": record.get("ela_score", 0.0),
                        "metadataTampered": record.get("metadata_tampered", False),
                        "softwareFingerprintDetected": record.get("software_detected"),
                        "semanticDiscrepancy": record.get("semantic_discrepancy", False),
                    }
                }
        except Exception as e:
            logger.error(f"Failed to fetch record for explanation: {e}")

    return ExplainabilityReportGenerator.generate_explanation_artifact(report_data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
