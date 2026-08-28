"""
ai_engine/ela_engine.py
-----------------------
Layer 1: Error Level Analysis (ELA) & OpenCV Anomaly Localization.
Detects pixel compression inconsistencies, splicing artifacts, and digital manipulation.
"""

import io
import base64
from typing import Tuple, List, Dict, Any
from PIL import Image, ImageChops, ImageEnhance
import numpy as np
import cv2


def compute_ela_and_anomalies(
    image_bytes: bytes,
    quality: int = 90,
    min_contour_area: int = 200,
    threshold_val: int = 100
) -> Tuple[float, str, List[Dict[str, Any]]]:
    """
    Error Level Analysis (ELA):
    1. Re-compresses the input image at a known baseline JPEG quality (e.g. 90%).
    2. Computes the maximum channel difference matrix between original and recompressed frames.
    3. Normalizes and amplifies differential contrast.
    4. Applies morphological denoising to eliminate microscopic sensor noise.
    5. Localizes spliced/manipulated anomaly clusters using OpenCV contours (> min_contour_area px).
    
    Returns:
        (ela_score, heatmap_base64_data_uri, list_of_anomaly_bounding_boxes)
    """
    try:
        orig_img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Invalid image format or corrupted bytes: {e}")

    # Ensure RGB color space for standard 3-channel JPEG compression
    if orig_img.mode != "RGB":
        orig_img = orig_img.convert("RGB")

    w_orig, h_orig = orig_img.size
    if w_orig == 0 or h_orig == 0:
        raise ValueError("Image dimensions must be non-zero.")

    # Step 1: Save re-compressed reference image in memory
    buffer = io.BytesIO()
    orig_img.save(buffer, "JPEG", quality=quality)
    buffer.seek(0)
    recompressed_img = Image.open(buffer)

    # Step 2: Compute pixel difference matrix
    diff = ImageChops.difference(orig_img, recompressed_img)
    diff_np = np.array(diff, dtype=np.float32)
    diff_magnitude = np.max(diff_np, axis=2)

    max_val = float(np.max(diff_magnitude))
    mean_val = float(np.mean(diff_magnitude))

    anomalies: List[Dict[str, Any]] = []

    # Step 3: Localize only absolute error spikes; normalized noise made clean JPEGs look forged.
    if max_val > 18:
        absolute_threshold = max(18.0, mean_val + (float(np.std(diff_magnitude)) * 4.0))
        thresh = np.where(diff_magnitude >= absolute_threshold, 255, 0).astype(np.uint8)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > min_contour_area:
                x, y, w, h = cv2.boundingRect(cnt)

                # Clamp percentage coordinates strictly to [0.0, 100.0]
                x_pct = round(min(100.0, max(0.0, (x / w_orig) * 100)), 2)
                y_pct = round(min(100.0, max(0.0, (y / h_orig) * 100)), 2)
                w_pct = round(min(100.0, max(0.0, (w / w_orig) * 100)), 2)
                h_pct = round(min(100.0, max(0.0, (h / h_orig) * 100)), 2)

                confidence = min(0.99, max(0.75, round(0.85 + (area / (w_orig * h_orig * 0.05)), 2)))

                anomalies.append({
                    "x": x_pct,
                    "y": y_pct,
                    "width": w_pct,
                    "height": h_pct,
                    "label": "Pixel Splicing Anomaly",
                    "confidence": confidence
                })

    # Step 4: Calibrate global ELA score (0 - 100)
    base_score = mean_val * 4.0
    if len(anomalies) > 0:
        base_score += 20.0 + (len(anomalies) * 8.0)
    ela_score = round(min(100.0, max(5.0, base_score)), 1)

    # Step 5: Generate Base64 Heatmap JPEG
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema]) if extrema else 1
    scale = 255.0 / max_diff if max_diff != 0 else 1.0
    enhanced_diff = ImageEnhance.Brightness(diff).enhance(scale)
    
    out_buffer = io.BytesIO()
    enhanced_diff.save(out_buffer, format="JPEG", quality=85)
    heatmap_b64 = f"data:image/jpeg;base64,{base64.b64encode(out_buffer.getvalue()).decode()}"

    return ela_score, heatmap_b64, anomalies
