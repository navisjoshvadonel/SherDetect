"""Best-effort text extraction for uploaded documents."""

import io
import re
import warnings
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
    """Attempt OCR via Tesseract, falling back to byte-stream text scanning."""
    try:
        import pytesseract
        from PIL import Image

        text = pytesseract.image_to_string(Image.open(io.BytesIO(file_bytes))).strip()
        if text:
            return text
    except ImportError:
        warnings.warn(
            "[SherDetect] pytesseract is not installed — OCR is unavailable. "
            "Image-based documents will use limited byte-stream text extraction. "
            "Install Tesseract OCR for full accuracy.",
            stacklevel=2,
        )
    except Exception:
        pass

    # Fallback: extract readable ASCII/UTF-8 strings from the raw byte stream.
    # This captures embedded text metadata, EXIF descriptions, XMP text, and
    # any human-readable strings baked into the file (common in TIFF, PNG tEXt
    # chunks, and JPEG COM markers).
    return _extract_strings_from_bytes(file_bytes)


def _extract_strings_from_bytes(file_bytes: bytes, min_length: int = 6) -> str:
    """
    Scan raw bytes for sequences of printable ASCII/Latin-1 characters.
    Returns all fragments of at least *min_length* characters joined by newlines.
    This is a last-resort fallback when no OCR engine is available.
    """
    try:
        # Decode as latin-1 (lossless for all byte values) then pull printable runs
        raw = file_bytes.decode("latin-1", errors="replace")
        # Match runs of printable chars (letters, digits, punctuation, spaces)
        fragments = re.findall(r"[A-Za-z0-9 _.,:;@#&/()'\"\-]{%d,}" % min_length, raw)
        # Filter out binary junk that happens to be printable
        meaningful = [
            frag.strip()
            for frag in fragments
            if sum(1 for c in frag if c.isalpha()) >= min_length // 2
        ]
        return "\n".join(meaningful)
    except Exception:
        return ""
