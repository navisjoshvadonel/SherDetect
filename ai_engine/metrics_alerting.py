"""
ai_engine/metrics_alerting.py
------------------------------
Prometheus Metrics Exporter & Real-Time Alerting Engine.

Provides:
1. Prometheus-compatible `/metrics` endpoint data generation.
2. Real-time Alerting Rules for SLA breaches (latency spikes, high error rates, circuit breaker trips).
"""

import time
from typing import Dict, Any, List
from ai_engine.logger import setup_logger

logger = setup_logger("SherDetect.MetricsAlerting")


class MetricsCollector:
    _http_requests_total: int = 0
    _http_errors_total: int = 0
    _gemini_failures_total: int = 0
    _supabase_failures_total: int = 0
    _circuit_breaker_trips: int = 0
    _latencies_ms: List[float] = []

    @classmethod
    def record_request(cls, status_code: int, duration_ms: float):
        cls._http_requests_total += 1
        if status_code >= 400:
            cls._http_errors_total += 1
        cls._latencies_ms.append(duration_ms)
        # Keep last 1,000 latencies in buffer
        if len(cls._latencies_ms) > 1000:
            cls._latencies_ms.pop(0)

    @classmethod
    def record_gemini_failure(cls):
        cls._gemini_failures_total += 1

    @classmethod
    def record_supabase_failure(cls):
        cls._supabase_failures_total += 1

    @classmethod
    def record_circuit_breaker_trip(cls):
        cls._circuit_breaker_trips += 1

    @classmethod
    def generate_prometheus_metrics(cls) -> str:
        """
        Generates standard Prometheus formatted metric exposition text.
        """
        lats = sorted(cls._latencies_ms) if cls._latencies_ms else [0.0]
        p50 = lats[int(len(lats) * 0.50)]
        p95 = lats[int(len(lats) * 0.95)]
        p99 = lats[int(len(lats) * 0.99)]

        return f"""# HELP sherdetect_http_requests_total Total HTTP requests handled.
# TYPE sherdetect_http_requests_total counter
sherdetect_http_requests_total {cls._http_requests_total}

# HELP sherdetect_http_errors_total Total HTTP 4xx/5xx requests.
# TYPE sherdetect_http_errors_total counter
sherdetect_http_errors_total {cls._http_errors_total}

# HELP sherdetect_gemini_failures_total Total Layer 6 Gemini API failures.
# TYPE sherdetect_gemini_failures_total counter
sherdetect_gemini_failures_total {cls._gemini_failures_total}

# HELP sherdetect_supabase_failures_total Total Supabase audit write failures.
# TYPE sherdetect_supabase_failures_total counter
sherdetect_supabase_failures_total {cls._supabase_failures_total}

# HELP sherdetect_circuit_breaker_trips_total Total circuit breaker trip events.
# TYPE sherdetect_circuit_breaker_trips_total counter
sherdetect_circuit_breaker_trips_total {cls._circuit_breaker_trips}

# HELP sherdetect_request_duration_ms_p50 50th percentile request latency.
sherdetect_request_duration_ms_p50 {p50:.2f}

# HELP sherdetect_request_duration_ms_p95 95th percentile request latency.
sherdetect_request_duration_ms_p95 {p95:.2f}

# HELP sherdetect_request_duration_ms_p99 99th percentile request latency.
sherdetect_request_duration_ms_p99 {p99:.2f}
"""


class AlertingEngine:
    @classmethod
    def evaluate_active_alerts(cls) -> List[Dict[str, Any]]:
        alerts = []
        total_reqs = MetricsCollector._http_requests_total
        errors = MetricsCollector._http_errors_total
        
        # 1. Error Rate Alert (> 1.0% threshold)
        if total_reqs > 10:
            error_rate = (errors / total_reqs) * 100.0
            if error_rate > 1.0:
                alerts.append({
                    "alert_name": "HighErrorRateBreach",
                    "severity": "CRITICAL",
                    "value": f"{error_rate:.2f}%",
                    "threshold": "1.00%",
                    "message": f"HTTP error rate is {error_rate:.2f}%, exceeding SLA threshold."
                })

        # 2. Gemini API Failure Alert (> 3 failures)
        if MetricsCollector._gemini_failures_total >= 3:
            alerts.append({
                "alert_name": "GeminiSubProcessorDegradation",
                "severity": "WARNING",
                "value": MetricsCollector._gemini_failures_total,
                "message": "External Gemini LLM sub-processor experiencing elevated failure rate. Circuit breaker active."
            })

        # 3. Supabase Database Failure Alert (> 2 failures)
        if MetricsCollector._supabase_failures_total >= 2:
            alerts.append({
                "alert_name": "DatabasePersistenceFailure",
                "severity": "CRITICAL",
                "value": MetricsCollector._supabase_failures_total,
                "message": "Supabase audit trail writes failing. Check DB connection pool and credentials."
            })

        return alerts
