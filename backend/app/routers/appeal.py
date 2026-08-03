import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from typing import Optional
from openai import APIStatusError
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.security import limiter, read_upload
from app.services.pdf_parser import extract_text, text_from_text, compact
from app.services import appeal as appeal_svc

log = logging.getLogger("fineprint.router.appeal")
router = APIRouter()


@router.post("/api/appeal")
@limiter.limit("20/minute")
async def appeal(
    request: Request,
    denial: Optional[UploadFile] = File(None),
    denial_text: Optional[str] = Form(None),
):
    denial_bytes = await read_upload(denial, settings.MAX_UPLOAD_MB) if denial else None

    d_raw = extract_text(denial.filename, denial_bytes) if denial_bytes is not None else ""
    text = compact(d_raw or text_from_text(denial_text), 16000)

    if not text:
        raise HTTPException(400, "Provide a denial letter.")

    if not settings.OPENAI_API_KEY and not settings.GROQ_API_KEY:
        raise HTTPException(503, "Backend has no API key configured (set GROQ_API_KEY or OPENAI_API_KEY).")

    try:
        packet = await run_in_threadpool(appeal_svc.build, text)
    except APIStatusError as e:
        log.warning("provider rejected appeal: %s", e)
        raise HTTPException(422, f"AI provider rejected the document (too large for the free tier). Paste the denial letter as text instead. Detail: {getattr(e, 'message', str(e))}")
    except Exception as e:
        log.exception("appeal failed")
        raise HTTPException(500, f"Appeal generation failed: {e}")

    return {"sections": [s.model_dump() for s in packet.sections], "meta": packet.meta}










# import logging
# from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
# from typing import Optional
# from openai import APIStatusError
# from app.config import settings
# from app.security import limiter
# from app.services.pdf_parser import extract_text, text_from_text, compact
# from app.services import appeal as appeal_svc

# log = logging.getLogger("fineprint.router.appeal")
# router = APIRouter()

# @router.post("/api/appeal")
# @limiter.limit("20/minute")
# async def appeal(
#     request: Request,
#     denial: Optional[UploadFile] = File(None),
#     denial_text: Optional[str] = Form(None),
# ):
#     text = compact(extract_text(denial.filename, await denial.read()) if denial else text_from_text(denial_text), 16000)
#     if not text:
#         raise HTTPException(400, "Provide a denial letter.")
#     if not settings.OPENAI_API_KEY and not settings.GROQ_API_KEY:
#         raise HTTPException(503, "Backend has no API key configured (set GROQ_API_KEY or OPENAI_API_KEY).")
#     try:
#         packet = appeal_svc.build(text)
#     except APIStatusError as e:
#         log.warning("provider rejected appeal: %s", e)
#         raise HTTPException(422, f"AI provider rejected the document (too large for the free tier). Paste the denial letter as text instead. Detail: {getattr(e, 'message', str(e))}")
#     except Exception as e:
#         log.exception("appeal failed")
#         raise HTTPException(500, f"Appeal generation failed: {e}")
#     return {"sections": [s.model_dump() for s in packet.sections], "meta": packet.meta}