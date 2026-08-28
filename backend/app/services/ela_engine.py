import io
import base64
from PIL import Image, ImageChops, ImageEnhance
import numpy as np
import cv2

def compute_ela_and_anomalies(image_bytes: bytes, quality: int = 90):
    """
    Error Level Analysis (ELA): Detects pixel compression inconsistencies.
    Spliced/modified areas have higher compression error rates.
    """
    orig_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Save re-compressed reference image
    buffer = io.BytesIO()
    orig_img.save(buffer, "JPEG", quality=quality)
    buffer.seek(0)
    recompressed_img = Image.open(buffer)
    
    # Compute pixel difference
    diff = ImageChops.difference(orig_img, recompressed_img)
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    scale = 255.0 / max_diff if max_diff != 0 else 1.0
    
    enhanced_diff = ImageEnhance.Brightness(diff).enhance(scale)
    
    # Extract anomaly contours using OpenCV
    diff_cv = np.array(enhanced_diff)
    gray = cv2.cvtColor(diff_cv, cv2.COLOR_RGB2GRAY)
    _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    anomalies = []
    w_orig, h_orig = orig_img.size
    for cnt in contours:
        if cv2.contourArea(cnt) > 80:  # Ignore microscopic noise
            x, y, w, h = cv2.boundingRect(cnt)
            anomalies.append({
                "x": round((x / w_orig) * 100, 2),
                "y": round((y / h_orig) * 100, 2),
                "width": round((w / w_orig) * 100, 2),
                "height": round((h / h_orig) * 100, 2),
                "label": "Pixel Splicing Anomaly",
                "confidence": 0.94
            })
            
    ela_score = round(float(np.mean(gray)) * 2.5, 2)
    ela_score = min(100.0, max(5.0, ela_score))
    
    # Generate Base64 heatmap image
    out_buffer = io.BytesIO()
    enhanced_diff.save(out_buffer, format="JPEG")
    heatmap_b64 = f"data:image/jpeg;base64,{base64.b64encode(out_buffer.getvalue()).decode()}"
    
    return ela_score, heatmap_b64, anomalies
