import sys
import os

# Delegate to AI Role module in ai_engine package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from ai_engine.ai_validator import extract_fallback_heuristics, validate_document_semantics

__all__ = ["extract_fallback_heuristics", "validate_document_semantics"]
