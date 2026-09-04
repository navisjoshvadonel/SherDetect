"""
ai_engine/telemetry.py
----------------------
Structured JSON Logging & Distributed APM OpenTelemetry Tracing Module.

Provides:
1. Structured JSON Logger emitting standard schema:
   {"timestamp": ..., "service": ..., "trace_id": ..., "event": ..., "latency_ms": ...}
2. Distributed Context Propagation (X-Trace-ID header tracking across microservices).
"""

import time
import json
import logging
import uuid
from typing import Dict, Any, Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configure standard JSON formatter
class JSONLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service": getattr(record, "service", "SherDetect-Platform"),
            "trace_id": getattr(record, "trace_id", "00000000-0000-0000-0000-000000000000"),
            "latency_ms": getattr(record, "latency_ms", None),
            "http_status": getattr(record, "http_status", None),
        }
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_payload)


def get_structured_logger(name: str, service: str = "SherDetect-AI-Engine") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONLogFormatter())
        logger.addHandler(handler)
    return logger


# APM Distributed Tracing Middleware
class APMTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract X-Trace-ID header or create new UUID4 trace ID
        trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())
        request.state.trace_id = trace_id
        
        start_time = time.time()
        response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)
        
        # Inject trace ID into response headers
        response.headers["X-Trace-ID"] = trace_id
        response.headers["X-Response-Time-MS"] = str(duration_ms)
        
        return response
