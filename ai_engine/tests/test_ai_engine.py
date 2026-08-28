import pytest
import sys
import os

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ai_engine.ai_validator import extract_fallback_heuristics, validate_document_semantics
from ai_engine.ela_engine import compute_ela_and_anomalies

@pytest.mark.asyncio
async def test_clean_document_semantics():
    clean_text = "Item 1: 100.00, Item 2: 200.00, Total: 300.00"
    result_clean = await validate_document_semantics(clean_text)
    assert not result_clean["semanticDiscrepancy"] or len(result_clean["detectedAnomalies"]) == 0

@pytest.mark.asyncio
async def test_tampered_document_semantics():
    tampered_text = "Item 1: 100.00, Item 2: 200.00, Total: 9500.00"
    result_tampered = await validate_document_semantics(tampered_text)
    assert result_tampered["semanticDiscrepancy"]

