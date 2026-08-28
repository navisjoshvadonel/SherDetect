"""
ai_engine/sharpness_inspector.py
--------------------------------
Laplacian Variance & Gradient Sharpness Inconsistency Inspector.
Detects digital text overlay and copy-move forgery on scanned documents
by measuring local Laplacian variance: sigma^2(Laplacian(I)).
Scanned paper exhibits organic sensor blur, whereas digitally pasted text
exhibits abnormally sharp edge gradients (Z-score outlier).
"""

import io
from typing import Dict, Any, List
from PIL import Image
import numpy as np
import cv2


class SharpnessInspector:
    @classmethod
    def analyze_sharpness_inconsistency(
        cls,
        image_bytes: bytes,
        grid_size: int = 32,
        z_threshold: float = 3.2
    ) -> Dict[str, Any]:
        """
        Calculates localized patch-level Laplacian variance across the document.
        Identifies regions with anomalous sharpness spikes indicating digital text overlay.
        """
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            return {
                "hasSharpnessAnomaly": False,
                "anomalies": [],
                "sharpnessRiskScore": 0.0,
                "summary": f"Image parsing skipped for sharpness audit: {e}"
            }

        img_np = np.array(img)
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        h, w = gray.shape

        if h < grid_size * 2 or w < grid_size * 2:
            return {
                "hasSharpnessAnomaly": False,
                "anomalies": [],
                "sharpnessRiskScore": 0.0,
                "summary": "Image dimensions too small for patch-based gradient audit."
            }

        # Calculate localized Laplacian variance across the grid
        variances: List[float] = []
        patch_coords: List[tuple] = []

        for y in range(0, h - grid_size, grid_size):
            for x in range(0, w - grid_size, grid_size):
                patch = gray[y : y + grid_size, x : x + grid_size]
                # Ignore plain white/black background margins
                if np.std(patch) > 8:
                    lap = cv2.Laplacian(patch, cv2.CV_64F)
                    var_val = float(lap.var())
                    variances.append(var_val)
                    patch_coords.append((x, y, var_val))

        if len(variances) < 10:
            return {
                "hasSharpnessAnomaly": False,
                "anomalies": [],
                "sharpnessRiskScore": 0.0,
                "summary": "Insufficient non-blank document content for sharpness profiling."
            }

        var_array = np.array(variances)
        median_var = float(np.median(var_array))
        std_var = float(np.std(var_array)) + 1e-6

        anomalies: List[Dict[str, Any]] = []
        for x, y, val in patch_coords:
            z_score = (val - median_var) / std_var
            if z_score > z_threshold and val > 150.0:
                x_pct = round((x / w) * 100, 2)
                y_pct = round((y / h) * 100, 2)
                w_pct = round((grid_size / w) * 100, 2)
                h_pct = round((grid_size / h) * 100, 2)

                anomalies.append({
                    "x": x_pct,
                    "y": y_pct,
                    "width": w_pct,
                    "height": h_pct,
                    "label": "Sharpness / Digital Overlay Inconsistency",
                    "zScore": round(float(z_score), 2),
                    "confidence": min(0.95, 0.70 + float(z_score) * 0.05)
                })

        has_anomaly = len(anomalies) > 0
        risk_score = min(90.0, len(anomalies) * 25.0) if has_anomaly else 0.0

        return {
            "hasSharpnessAnomaly": has_anomaly,
            "medianLaplacianVariance": round(median_var, 2),
            "detectedAnomalies": anomalies,
            "sharpnessRiskScore": round(risk_score, 1),
            "summary": (
                f"Detected {len(anomalies)} region(s) with anomalous edge sharpness, indicating digital text superimposed on scan."
                if has_anomaly
                else "Document exhibits consistent optical gradient sharpness across all text blocks."
            )
        }
