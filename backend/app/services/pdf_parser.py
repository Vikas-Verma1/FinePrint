import logging
log = logging.getLogger("fineprint.parser")

def extract_text(filename: str, data: bytes) -> str:
    name = (filename or "").lower()
    # Plain text passthrough
    if name.endswith((".txt", ".md")):
        try: return data.decode("utf-8", errors="ignore")
        except Exception: return ""

    # PDF: pdfplumber first
    if name.endswith(".pdf"):
        text = _pdfplumber(data)
        if text and len(text.strip()) > 80:
            return text
        # OCR fallback (only if deps installed)
        ocr = _ocr(data)
        return ocr or text or ""

    # Images: OCR only
    if name.endswith((".png", ".jpg", ".jpeg")):
        return _ocr(data) or ""

    # Last resort
    try: return data.decode("utf-8", errors="ignore")
    except Exception: return ""

def _pdfplumber(data: bytes) -> str:
    try:
        import pdfplumber, io
        out = []
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                out.append(t)
        return "\n".join(out)
    except Exception as e:
        log.warning("pdfplumber failed: %s", e)
        return ""

def _ocr(data: bytes) -> str:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract, io
        images = convert_from_bytes(data)
        return "\n".join(pytesseract.image_to_string(img) for img in images)
    except Exception as e:
        log.info("OCR unavailable or failed: %s", e)
        return ""

def text_from_text(value: str) -> str:
    return (value or "").strip()