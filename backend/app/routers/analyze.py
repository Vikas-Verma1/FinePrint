import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from typing import Optional
from openai import APIStatusError
from app.config import settings
from app.security import limiter
from app.services.pdf_parser import extract_text, text_from_text, compact
from app.services import matcher
from app.models import Report

log = logging.getLogger("fineprint.router.analyze")
router = APIRouter()

@router.post("/api/analyze")
@limiter.limit("20/minute")
async def analyze(
    request: Request,
    policy: Optional[UploadFile] = File(None),
    records: Optional[UploadFile] = File(None),
    policy_text: Optional[str] = Form(None),
    records_text: Optional[str] = Form(None),
):
    p = compact(extract_text(policy.filename, await policy.read()) if policy else text_from_text(policy_text), 16000)
    r = compact(extract_text(records.filename, await records.read()) if records else text_from_text(records_text), 8000)
    if not p and not r:
        raise HTTPException(400, "Provide a policy and/or medical records.")
    if not settings.OPENAI_API_KEY and not settings.GROQ_API_KEY:
        raise HTTPException(503, "Backend has no API key configured (set GROQ_API_KEY or OPENAI_API_KEY).")
    try:
        report: Report = matcher.analyze(p, r)
    except APIStatusError as e:
        log.warning("provider rejected analyze: %s", e)
        raise HTTPException(422, f"AI provider rejected the document (too large for the free tier). Use a shorter policy or paste the key clauses as text instead. Detail: {getattr(e, 'message', str(e))}")
    except Exception as e:
        log.exception("analyze failed")
        raise HTTPException(500, f"Analysis failed: {e}")
    return {"report": report.model_dump()}