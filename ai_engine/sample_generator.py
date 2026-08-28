"""
ai_engine/sample_generator.py
-----------------------------
Autonomous Forensic Sample & Demonstration Fixture Generator.
Generates synthetic authentic and tampered document samples for hackathon
pitches, live testing, and automated test pipelines:
1. Clean Authentic Invoice (Passes all 6 layers)
2. Spliced JPEG Invoice (Triggers ELA & OpenCV heatmap)
3. Arithmetic Tampered Invoice (Triggers Gemini Semantic reasoner & Offline fallback)
4. Benford Violated Invoice (Triggers Statistical Accounting anomaly)
5. Corrupted ID / Aadhaar (Triggers Verhoeff & Luhn Checksum failure)
"""

import io
from typing import Dict, Any
from PIL import Image, ImageDraw


class SampleGenerator:
    @staticmethod
    def generate_clean_invoice() -> Dict[str, Any]:
        """Generates an authentic invoice image and matching text."""
        img = Image.new("RGB", (600, 750), color=(252, 252, 252))
        draw = ImageDraw.Draw(img)

        # Header
        draw.rectangle([40, 40, 560, 110], fill=(230, 235, 245), outline=(180, 190, 210))
        draw.text((60, 60), "APEX GLOBAL LOGISTICS - TAX INVOICE", fill=(20, 30, 60))
        draw.text((60, 85), "Invoice #: INV-2026-0881 | Date: 2026-08-20", fill=(70, 80, 100))

        # Items
        draw.text((60, 150), "1. Cloud Server Hosting (US-East) ...... $150.00", fill=(30, 30, 30))
        draw.text((60, 190), "2. CDN & Edge Bandwidth (10TB) .......... $50.00", fill=(30, 30, 30))
        draw.line([(40, 240), (560, 240)], fill=(200, 200, 200), width=1)

        # Math Section
        draw.text((60, 270), "Subtotal: $200.00", fill=(30, 30, 30))
        draw.text((60, 300), "Tax (GST 10%): $20.00", fill=(30, 30, 30))
        draw.text((60, 340), "Total Amount Due: $220.00", fill=(0, 120, 40))

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        
        text = "APEX GLOBAL LOGISTICS - TAX INVOICE. Invoice #: INV-2026-0881. Date: 2026-08-20. 1. Cloud Server Hosting: $150.00, 2. CDN Bandwidth: $50.00. Subtotal: $200.00, Tax: $20.00, Total: $220.00"
        return {
            "imageBytes": buf.getvalue(),
            "text": text,
            "filename": "authentic_apex_invoice.jpg",
            "expectedVerdict": "VERIFIED_AUTHENTIC"
        }

    @staticmethod
    def generate_spliced_invoice() -> Dict[str, Any]:
        """Generates an invoice with a spliced high-contrast block for ELA detection."""
        clean = SampleGenerator.generate_clean_invoice()
        orig = Image.open(io.BytesIO(clean["imageBytes"])).convert("RGB")

        # Splice an uncompressed foreign graphic patch over the total amount
        draw = ImageDraw.Draw(orig)
        draw.rectangle([50, 330, 350, 380], fill=(255, 230, 230), outline=(220, 50, 50))
        draw.text((60, 345), "ALTERED TOTAL: $14,220.00", fill=(180, 0, 0))

        buf = io.BytesIO()
        orig.save(buf, format="JPEG", quality=95)
        
        text = "APEX GLOBAL LOGISTICS. Subtotal: $200.00, Tax: $20.00, Total: $14,220.00"
        return {
            "imageBytes": buf.getvalue(),
            "text": text,
            "filename": "forged_spliced_invoice.jpg",
            "expectedVerdict": "FORGERY_DETECTED"
        }

    @staticmethod
    def generate_math_tampered_invoice() -> Dict[str, Any]:
        """Generates an invoice with modified line-item figures."""
        text = "VENDOR: TechCorp Global. Subtotal: $450.00, Tax: $50.00, Total: $9,450.00"
        clean = SampleGenerator.generate_clean_invoice()
        return {
            "imageBytes": clean["imageBytes"],
            "text": text,
            "filename": "forged_math_mismatch.jpg",
            "expectedVerdict": "FORGERY_DETECTED"
        }

    @staticmethod
    def generate_benford_violated_invoice() -> Dict[str, Any]:
        """Generates an invoice containing synthetic numbers violating Benford's Law."""
        text = "Invoice Line Items: Widget A: $910.00, Widget B: $920.00, Widget C: $950.00, Widget D: $990.00, Widget E: $980.00, Total: $4,750.00"
        clean = SampleGenerator.generate_clean_invoice()
        return {
            "imageBytes": clean["imageBytes"],
            "text": text,
            "filename": "forged_benford_violation.jpg",
            "expectedVerdict": "SUSPICIOUS"
        }

    @staticmethod
    def generate_corrupted_id_sample() -> Dict[str, Any]:
        """Generates an ID document string with corrupted Verhoeff checksum."""
        text = "Republic of India Identity Authority. Citizen Name: Vikram Patel, Aadhaar UID: 2345 6789 0129. Valid ID Card."
        clean = SampleGenerator.generate_clean_invoice()
        return {
            "imageBytes": clean["imageBytes"],
            "text": text,
            "filename": "corrupted_aadhaar_id.jpg",
            "expectedVerdict": "FORGERY_DETECTED"
        }
