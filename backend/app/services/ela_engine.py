import sys
import os

# Delegate to AI Role module in ai_engine package
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from ai_engine.ela_engine import compute_ela_and_anomalies

__all__ = ["compute_ela_and_anomalies"]
