import asyncio
import os
import zipfile
import tempfile
from typing import Dict, Any

from ai_engine.celery_app import celery_app
from ai_engine.core_processor import process_document_bytes
from ai_engine.logger import setup_logger

logger = setup_logger("SherDetect.Tasks")

@celery_app.task(bind=True)
def process_document_task(self, file_path: str, file_name: str, content_type: str) -> Dict[str, Any]:
    """
    Celery background task for processing a single document.
    """
    try:
        logger.info(f"Starting background processing for {file_name} from {file_path}")
        with open(file_path, "rb") as f:
            contents = f.read()
            
        # Run the async core processor synchronously in the Celery worker
        report = asyncio.run(process_document_bytes(contents, file_name, content_type))
        
        # Clean up temporary file
        try:
            os.remove(file_path)
        except OSError:
            pass
            
        return report
    except Exception as e:
        logger.error(f"Error processing document {file_name}: {e}")
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise

@celery_app.task(bind=True)
def process_batch_zip_task(self, zip_file_path: str) -> Dict[str, Any]:
    """
    Celery background task to extract a ZIP archive and queue sub-tasks for each file.
    """
    try:
        logger.info(f"Starting batch ZIP processing from {zip_file_path}")
        extract_dir = tempfile.mkdtemp(prefix="sherdetect_batch_")
        
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            
        results = []
        for root, _, files in os.walk(extract_dir):
            for file_name in files:
                # Basic filter for supported files
                if file_name.startswith('.') or file_name.endswith('.txt'):
                    continue
                    
                file_path = os.path.join(root, file_name)
                
                # Naive content type inference
                content_type = "image/jpeg"
                if file_name.lower().endswith('.pdf'):
                    content_type = "application/pdf"
                elif file_name.lower().endswith('.png'):
                    content_type = "image/png"
                    
                # Queue a sub-task for each file
                task = process_document_task.delay(file_path, file_name, content_type)
                results.append({
                    "fileName": file_name,
                    "taskId": task.id
                })
        
        # Clean up original zip file
        try:
            os.remove(zip_file_path)
        except OSError:
            pass
            
        return {"batchId": self.request.id, "queuedDocuments": len(results), "tasks": results}
    except Exception as e:
        logger.error(f"Error processing ZIP batch: {e}")
        self.update_state(state='FAILURE', meta={'exc_type': type(e).__name__, 'exc_message': str(e)})
        raise
