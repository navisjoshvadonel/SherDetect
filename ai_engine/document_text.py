"""Best-effort text extraction for uploaded documents."""

import io
from typing import Optional


def extract_document_text(file_bytes: bytes, content_type: Optional[str] = None) -> str:
    """Extract text from PDFs or OCR raster images without using the filename as evidence."""
    if content_type == "application/pdf" or file_bytes.startswith(b"%PDF"):
        try:
            import fitz

            with fitz.open(stream=file_bytes, filetype="pdf") as pdf:
                text = "\n".join(page.get_text() for page in pdf).strip()
                if text:
                    return text
                ocr_parts = []
                for page in pdf:
                    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                    ocr_parts.append(_ocr_bytes(pixmap.tobytes("png")))
                return "\n".join(part for part in ocr_parts if part).strip()
        except Exception:
            return ""

    return _ocr_bytes(file_bytes)


def _ocr_bytes(file_bytes: bytes) -> str:
    try:
        import pytesseract
        from PIL import Image

        return pytesseract.image_to_string(Image.open(io.BytesIO(file_bytes))).strip()
    except Exception:
        return ""
