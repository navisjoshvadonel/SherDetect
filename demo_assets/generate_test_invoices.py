from PIL import Image, ImageDraw
import os

def create_invoice(filename: str, total_amount: str, is_tampered: bool = False):
    img = Image.new("RGB", (700, 900), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Brand Header
    draw.rectangle([(0, 0), (700, 100)], fill=(15, 23, 42))
    draw.text((40, 35), "SHERDETECT DEMO CORP", fill=(6, 182, 212))
    draw.text((500, 40), "INVOICE #9821", fill=(255, 255, 255))
    
    # Metadata
    draw.text((40, 130), "Billed To: Enterprise Client Ltd", fill=(71, 85, 105))
    draw.text((40, 155), "Date: 2026-08-28", fill=(71, 85, 105))
    draw.text((40, 180), "Due Date: 2026-09-15", fill=(71, 85, 105))
    
    # Table Header
    draw.rectangle([(40, 230), (660, 265)], fill=(241, 245, 249))
    draw.text((55, 240), "Description", fill=(15, 23, 42))
    draw.text((420, 240), "Qty", fill=(15, 23, 42))
    draw.text((560, 240), "Amount", fill=(15, 23, 42))
    
    # Line Items
    draw.text((55, 290), "Enterprise Cloud Infrastructure", fill=(51, 65, 85))
    draw.text((430, 290), "1", fill=(51, 65, 85))
    draw.text((560, 290), "$150.00", fill=(51, 65, 85))
    
    draw.text((55, 330), "AI Cybersecurity Forensics Audit", fill=(51, 65, 85))
    draw.text((430, 330), "1", fill=(51, 65, 85))
    draw.text((560, 330), "$300.00", fill=(51, 65, 85))
    
    # Subtotal and Tax
    draw.line([(40, 400), (660, 400)], fill=(203, 213, 225), width=1)
    draw.text((420, 420), "Subtotal:", fill=(71, 85, 105))
    draw.text((560, 420), "$450.00", fill=(71, 85, 105))
    draw.text((420, 450), "Tax (10%):", fill=(71, 85, 105))
    draw.text((560, 450), "$50.00", fill=(71, 85, 105))
    
    # Total Box
    draw.rectangle([(400, 490), (660, 540)], fill=(15, 23, 42) if not is_tampered else (230, 235, 240))
    draw.text((420, 505), "TOTAL DUE:", fill=(255, 255, 255) if not is_tampered else (15, 23, 42))
    
    if is_tampered:
        # Simulate visual splicing & compression differential
        draw.rectangle([(540, 495), (655, 535)], fill=(255, 255, 255))
        draw.text((545, 505), total_amount, fill=(0, 0, 0))
    else:
        draw.text((550, 505), total_amount, fill=(6, 182, 212))

    img.save(filename, "JPEG", quality=85)
    print(f"Generated: {filename}")

if __name__ == "__main__":
    create_invoice("demo_assets/authentic_invoice.png", "$500.00", is_tampered=False)
    create_invoice("demo_assets/forged_invoice.png", "$9,450.00", is_tampered=True)
