import os
import json
import time
import requests
import base64
from celery import shared_task
from contracts.api_spec import ForensicReport
from backend.app.logger import setup_logger

logger = setup_logger("SherDetect.Tasks")

# Supabase Client Setup for Worker
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
supabase_client = None

if SUPABASE_URL and SUPABASE_ANON_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    except Exception as e:
        logger.warning(f"Supabase init failed in worker: {e}")

@shared_task(bind=True, name="process_document_task")
def process_document_task(self, job_id: str, file_path: str, file_name: str, content_type: str, file_hash: str):
    """
    Celery task to handle heavy forensic AI processing asynchronously.
    """
    try:
        logger.info(f"Worker started job {job_id} for file {file_name}")
        
        # 1. Read file from local staging
        if not os.path.exists(file_path):
            return {"error": "File not found in staging area"}
            
        with open(file_path, "rb") as f:
            contents = f.read()

        # 2. Forward to AI Engine microservice (synchronously)
        ai_engine_url = os.getenv("AI_ENGINE_URL", "http://localhost:8000/api/verify-document")
        files_payload = {"file": (file_name, contents, content_type)}
        
        response = requests.post(ai_engine_url, files=files_payload, timeout=180.0)
            
        if response.status_code != 200:
            logger.error(f"AI Engine failed: {response.text}")
            return {"error": f"AI Engine failed: {response.text}"}
            
        report_data = response.json()
        report = ForensicReport(**report_data)

        # 3. Persist to Supabase Storage & Database
        if supabase_client:
            storage_path = f"{job_id}/{file_name}"
            heatmap_path = f"{job_id}/ela_heatmap.png"
            
            try:
                # Attempt to upload original evidence
                supabase_client.storage.from_("evidence").upload(
                    path=storage_path,
                    file=contents,
                    file_options={"content-type": content_type}
                )
                logger.info(f"Uploaded evidence to storage: {storage_path}")
                
                # Attempt to upload ELA heatmap if generated
                if report.tamperHeatmapBase64:
                    heatmap_bytes = base64.b64decode(report.tamperHeatmapBase64)
                    supabase_client.storage.from_("heatmaps").upload(
                        path=heatmap_path,
                        file=heatmap_bytes,
                        file_options={"content-type": "image/png"}
                    )
                    logger.info(f"Uploaded heatmap to storage: {heatmap_path}")
            except Exception as storage_err:
                logger.warning(f"Storage upload failed (buckets might not exist or RLS blocked): {storage_err}")

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
                    "actor": "SherDetect AI Celery Worker",
                    "note": f"{report.verdict} | Risk Score: {report.fraudRiskScore}% | {report.forensicSummary[:120]}",
                }).execute()
            except Exception as db_err:
                logger.error(f"Supabase persistence failed in worker: {db_err}")

        # 4. Cleanup temp file
        try:
            os.remove(file_path)
        except OSError:
            pass

        return report_data

    except Exception as e:
        logger.error(f"Worker failed on job {job_id}: {str(e)}")
        return {"error": str(e)}
