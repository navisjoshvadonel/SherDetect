import pytest
import time
from ai_engine.ai_validator import GeminiCircuitBreaker

def test_circuit_breaker_closed_state():
    cb = GeminiCircuitBreaker(max_failures=3, cooldown_seconds=10.0)
    assert cb.state == "CLOSED"
    assert cb.allow_request() is True

def test_circuit_breaker_trips_to_open():
    cb = GeminiCircuitBreaker(max_failures=3, cooldown_seconds=10.0)
    cb.record_failure()
    cb.record_failure()
    assert cb.state == "CLOSED"
    assert cb.allow_request() is True
    
    cb.record_failure() # 3rd failure -> Trips to OPEN
    assert cb.state == "OPEN"
    assert cb.allow_request() is False

def test_circuit_breaker_half_open_recovery():
    cb = GeminiCircuitBreaker(max_failures=2, cooldown_seconds=0.1)
    cb.record_failure()
    cb.record_failure()
    assert cb.state == "OPEN"
    assert cb.allow_request() is False
    
    time.sleep(0.15) # Exceed cooldown
    assert cb.allow_request() is True
    assert cb.state == "HALF-OPEN"
    
    cb.record_success()
    assert cb.state == "CLOSED"
    assert cb.allow_request() is True
