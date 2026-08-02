import re
import logging
log = logging.getLogger("fineprint.parser")

def extract_text(filename: str, data: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith((".txt", ".md")):
        try: return data.decode("utf-8", errors="ignore")
        except Exception: return ""
    if name.endswith(".pdf"):
        text = _pdfplumber(data)
        if text and len(text.strip()) > 80:
            return text
        ocr = _ocr(data)
        return ocr or text or ""
    if name.endswith((".png", ".jpg", ".jpeg")):
        return _ocr(data) or ""
    try: return data.decode("utf-8", errors="ignore")
    except Exception: return ""

def _pdfplumber(data: bytes) -> str:
    try:
        import pdfplumber, io
        out = []
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                out.append(page.extract_text() or "")
        return "\n".join(out)
    except Exception as e:
        log.warning("pdfplumber failed: %s", e)
        return ""

def _ocr(data: bytes) -> str:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
        return "\n".join(pytesseract.image_to_string(img) for img in convert_from_bytes(data))
    except Exception as e:
        log.info("OCR unavailable or failed: %s", e)
        return ""

def text_from_text(value: str) -> str:
    return (value or "").strip()

def compact(text: str, max_chars: int = 16000) -> str:
    """Collapse repeated boilerplate lines and cap length so the text fits
    free-tier model token limits. Keeps the first, most clause-dense pages."""
    if not text:
        return ""
    out, prev = [], None
    for raw in text.splitlines():
        ln = raw.strip()
        if not ln:
            if out and out[-1] != "":
                out.append("")
            prev = None
            continue
        if ln == prev:          # drop consecutive duplicate lines (huge in prospectuses)
            continue
        prev = ln
        out.append(ln)
    cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(out)).strip()
    if len(cleaned) > max_chars:
        cleaned = cleaned[:max_chars] + "\n\n[…document truncated to fit model limits — paste specific clauses as text for a deeper read…]"
    return cleaned