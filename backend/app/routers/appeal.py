from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.config import settings
from app.security import limiter
from app.services.pdf_parser import extract_text, text_from_text
from app.services import appeal as appeal_svc, jobs

router = APIRouter()

@router.post("/api/appeal")
@limiter.limit("20/minute")
async def appeal(
    request,
    denial: Optional[UploadFile] = File(None),
    denial_text: Optional[str] = Form(None),
):
    text = extract_text(denial.filename, await denial.read()) if denial else text_from_text(denial_text)
    if not text:
        raise HTTPException(400, "Provide a denial letter.")
    if not settings.OPENAI_API_KEY:
        raise HTTPException(503, "Backend has no OPENAI_API_KEY; frontend will fall back to demo.")

    if len(text) > settings.ANALYSIS_ASYNC_CHAR_THRESHOLD:
        try:
            return {"job_id": jobs.enqueue("run_appeal", [text])}
        except Exception:
            pass

    packet = appeal_svc.build(text)
    return {"sections": [s.model_dump() for s in packet.sections], "meta": packet.meta}