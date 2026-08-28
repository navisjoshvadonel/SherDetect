import asyncio
import sys
import os

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ai_engine.ai_validator import extract_fallback_heuristics, validate_document_semantics
from ai_engine.ela_engine import compute_ela_and_anomalies

async def run_tests():
    print("--- Running AI Engine Forensic Tests ---")
    
    # Test 1: Authentic Invoice Data
    clean_text = "Item 1: 100.00, Item 2: 200.00, Total: 300.00"
    result_clean = await validate_document_semantics(clean_text)
    print("Test 1 (Clean Document):", result_clean)
    assert not result_clean["semanticDiscrepancy"] or len(result_clean["detectedAnomalies"]) == 0
    
    # Test 2: Forged / Tampered Invoice Data
    tampered_text = "Item 1: 100.00, Item 2: 200.00, Total: 9500.00"
    result_tampered = await validate_document_semantics(tampered_text)
    print("Test 2 (Tampered Document):", result_tampered)
    assert result_tampered["semanticDiscrepancy"]
    
    print("\n✅ All AI Engine Forensic unit tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_tests())
