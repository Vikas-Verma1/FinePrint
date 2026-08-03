import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from typing import Optional
from openai import APIStatusError
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.security import limiter, read_upload
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
    policy_bytes = await read_upload(policy, settings.MAX_UPLOAD_MB) if policy else None
    records_bytes = await read_upload(records, settings.MAX_UPLOAD_MB) if records else None

    # File extraction first; if the file has no readable text on the server
    # (scanned PDF / image without OCR), fall back to the text the browser
    # extracted client-side (or the user pasted).
    p_raw = extract_text(policy.filename, policy_bytes) if policy_bytes is not None else ""
    r_raw = extract_text(records.filename, records_bytes) if records_bytes is not None else ""

    p = compact(p_raw or text_from_text(policy_text), 16000)
    r = compact(r_raw or text_from_text(records_text), 8000)

    if not p and not r:
        raise HTTPException(400, "Provide a policy and/or medical records.")

    if not settings.OPENAI_API_KEY and not settings.GROQ_API_KEY:
        raise HTTPException(503, "Backend has no API key configured (set GROQ_API_KEY or OPENAI_API_KEY).")

    try:
        report: Report = await run_in_threadpool(matcher.analyze, p, r)
    except APIStatusError as e:
        log.warning("provider rejected analyze: %s", e)
        raise HTTPException(422, f"AI provider rejected the document (too large for the free tier). Use a shorter policy or paste the key clauses as text instead. Detail: {getattr(e, 'message', str(e))}")
    except Exception as e:
        log.exception("analyze failed")
        raise HTTPException(500, f"Analysis failed: {e}")

    return {"report": report.model_dump()}







# import logging
# from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
# from typing import Optional
# from openai import APIStatusError
# from app.config import settings
# from app.security import limiter
# from app.services.pdf_parser import extract_text, text_from_text, compact
# from app.services import matcher
# from app.models import Report

# log = logging.getLogger("fineprint.router.analyze")
# router = APIRouter()

# @router.post("/api/analyze")
# @limiter.limit("20/minute")
# async def analyze(
#     request: Request,
#     policy: Optional[UploadFile] = File(None),
#     records: Optional[UploadFile] = File(None),
#     policy_text: Optional[str] = Form(None),
#     records_text: Optional[str] = Form(None),
# ):
#     p = compact(extract_text(policy.filename, await policy.read()) if policy else text_from_text(policy_text), 16000)
#     r = compact(extract_text(records.filename, await records.read()) if records else text_from_text(records_text), 8000)
#     if not p and not r:
#         raise HTTPException(400, "Provide a policy and/or medical records.")
#     if not settings.OPENAI_API_KEY and not settings.GROQ_API_KEY:
#         raise HTTPException(503, "Backend has no API key configured (set GROQ_API_KEY or OPENAI_API_KEY).")
#     try:
#         report: Report = matcher.analyze(p, r)
#     except APIStatusError as e:
#         log.warning("provider rejected analyze: %s", e)
#         raise HTTPException(422, f"AI provider rejected the document (too large for the free tier). Use a shorter policy or paste the key clauses as text instead. Detail: {getattr(e, 'message', str(e))}")
#     except Exception as e:
#         log.exception("analyze failed")
#         raise HTTPException(500, f"Analysis failed: {e}")
#     return {"report": report.model_dump()}