import pytest
import asyncio
from ai_engine.telemetry import get_structured_logger
from ai_engine.metrics_alerting import MetricsCollector, AlertingEngine
from ai_engine.tests.load_test_suite import HighConcurrencyLoadTester

def test_structured_json_logger():
    logger = get_structured_logger("TestLogger")
    assert logger.name == "TestLogger"

def test_prometheus_metrics_generation():
    MetricsCollector.record_request(status_code=200, duration_ms=12.5)
    MetricsCollector.record_request(status_code=200, duration_ms=18.0)
    MetricsCollector.record_gemini_failure()
    
    prom_text = MetricsCollector.generate_prometheus_metrics()
    assert "sherdetect_http_requests_total" in prom_text
    assert "sherdetect_gemini_failures_total" in prom_text

def test_system_alerting_engine():
    MetricsCollector.record_supabase_failure()
    MetricsCollector.record_supabase_failure()
    
    alerts = AlertingEngine.evaluate_active_alerts()
    assert any(a["alert_name"] == "DatabasePersistenceFailure" for a in alerts)

@pytest.mark.asyncio
async def test_high_concurrency_load_test():
    result = await HighConcurrencyLoadTester.run_concurrent_load_test(total_requests=100, concurrency_limit=25)
    assert result["status"] == "LOAD_TEST_PASSED"
    assert result["throughput_rps"] > 10.0
    assert result["latency_ms_p99"] < 1000.0
