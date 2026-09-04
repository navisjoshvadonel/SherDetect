import io
import os
import time
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from ai_engine.core_processor import process_document_bytes
from ai_engine.tasks import process_batch_zip_task, celery_app
from ai_engine.sample_generator import SampleGenerator
from ai_engine.logger import setup_logger
from ai_engine.security_guards import (
    validate_file_security,
    rate_limiter,
    EnterpriseSecurityHeadersMiddleware,
    parse_strict_cors_origins,
)

logger = setup_logger("SherDetect.AIEngine")

app = FastAPI(
    title="SherDetect AI Forensic Engine API",
    description="Live Enterprise Python Forensic Engine with Security Guards & Celery Queueing.",
    version="2.0.0",
)

# ── Enterprise Security Headers Middleware ────────────────────────────────────
app.add_middleware(EnterpriseSecurityHeadersMiddleware)

# ── Strict CORS Policy (No Wildcards) ─────────────────────────────────────────
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

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SherDetect AI Forensic Engine", "version": "1.2.0"}

@app.get("/api/sample-documents")
def get_demo_samples():
    """Generates synthetic authentic and forged sample fixtures for live hackathon demos."""
    clean = SampleGenerator.generate_clean_invoice()
    spliced = SampleGenerator.generate_spliced_invoice()
    math_tampered = SampleGenerator.generate_math_tampered_invoice()
    benford_tampered = SampleGenerator.generate_benford_violated_invoice()
    corrupted_id = SampleGenerator.generate_corrupted_id_sample()

    return {
        "samples": [
            {"name": clean["filename"], "type": "authentic", "expectedVerdict": clean["expectedVerdict"]},
            {"name": spliced["filename"], "type": "forged_ela", "expectedVerdict": spliced["expectedVerdict"]},
            {"name": math_tampered["filename"], "type": "forged_math", "expectedVerdict": math_tampered["expectedVerdict"]},
            {"name": benford_tampered["filename"], "type": "forged_benford", "expectedVerdict": benford_tampered["expectedVerdict"]},
            {"name": corrupted_id["filename"], "type": "corrupted_id", "expectedVerdict": corrupted_id["expectedVerdict"]},
        ]
    }

MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

@app.post("/api/verify-document")
async def verify_document(request: Request, file: UploadFile = File(...)):
    # ── 1. Rate Limiting Check ────────────────────────────────────────────────
    client_ip = request.client.host if request.client else "unknown"
    rate_limiter.check_rate_limit(client_ip)

    start_time = time.time()
    try:
        content_length = file.headers.get("content-length")
        if content_length and content_length.isdigit():
            if int(content_length) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(status_code=413, detail=f"File exceeds {MAX_FILE_SIZE_MB} MB limit.")

        byte_chunks = []
        total_bytes = 0
        chunk_size = 1024 * 1024

        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_FILE_SIZE_BYTES:
                raise HTTPException(status_code=413, detail=f"File exceeds {MAX_FILE_SIZE_MB} MB limit.")
            byte_chunks.append(chunk)

        contents = b"".join(byte_chunks)
        raw_name = file.filename or "uploaded_document.pdf"
        
        # ── 2. Security Guard: Magic Bytes & Extension Check ─────────────────
        clean_file_name = validate_file_security(contents, raw_name, file.content_type)

        # Use the decoupled core processor (runs synchronously in the API here)
        report = await process_document_bytes(
            contents=contents, 
            file_name=clean_file_name, 
            content_type=file.content_type,
            start_time=start_time
        )
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verify_document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/batch-verify")
async def batch_verify(file: UploadFile = File(...)):
    """
    Accepts a ZIP archive of documents, saves it temporarily, and dispatches a Celery task.
    """
    try:
        if not file.filename.lower().endswith('.zip'):
            raise HTTPException(status_code=400, detail="Batch verify requires a .zip file format.")
            
        # Create a temporary file to hold the zip
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
        try:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                temp_zip.write(chunk)
        finally:
            temp_zip.close()
            
        # Dispatch Celery background task
        task = process_batch_zip_task.delay(temp_zip.name)
        
        return {
            "status": "queued",
            "message": "Batch processing job has been queued successfully.",
            "batchTaskId": task.id
        }
    except Exception as e:
        logger.error(f"Error in batch_verify: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/task-status/{task_id}")
def get_task_status(task_id: str):
    """
    Polls the Redis Celery backend for the status of a specific task.
    """
    task_result = celery_app.AsyncResult(task_id)
    response = {
        "taskId": task_id,
        "status": task_result.status,
    }
    
    if task_result.status == "SUCCESS":
        response["result"] = task_result.result
    elif task_result.status == "FAILURE":
        response["error"] = str(task_result.info)
        
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai_engine.server:app", host="0.0.0.0", port=8000, reload=True)
