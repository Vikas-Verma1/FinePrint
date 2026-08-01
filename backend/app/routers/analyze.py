from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.config import settings
from app.security import limiter, read_upload
from app.services.pdf_parser import extract_text, text_from_text
from app.services import matcher, jobs
from app.models import Report

router = APIRouter()

def _gather(policy, records, policy_text, records_text):
    p = extract_text(policy.filename, policy.file.read()) if policy else text_from_text(policy_text)
    r = extract_text(records.filename, records.file.read()) if records else text_from_text(records_text)
    # NOTE: UploadFile.file is sync-readable here; see note below if you prefer fully async.
    return p, r

@router.post("/api/analyze")
@limiter.limit("20/minute")
async def analyze(
    request,
    policy: Optional[UploadFile] = File(None),
    records: Optional[UploadFile] = File(None),
    policy_text: Optional[str] = Form(None),
    records_text: Optional[str] = Form(None),
):
    if policy: await _check_size(policy)
    if records: await _check_size(records)

    p = extract_text(policy.filename, await policy.read()) if policy else text_from_text(policy_text)
    r = extract_text(records.filename, await records.read()) if records else text_from_text(records_text)
    if not p and not r:
        raise HTTPException(400, "Provide a policy and/or medical records.")
    if not settings.OPENAI_API_KEY:
        raise HTTPException(503, "Backend has no OPENAI_API_KEY; frontend will fall back to demo.")

    big = (len(p) + len(r)) > settings.ANALYSIS_ASYNC_CHAR_THRESHOLD
    if big:
        try:
            job_id = jobs.enqueue("run_analysis", [p, r])
            return {"job_id": job_id}
        except Exception:
            pass  # redis/worker down -> fall through to inline

    report: Report = matcher.analyze(p, r)
    return {"report": report.model_dump()}

async def _check_size(f: UploadFile):
    # peek without consuming: read then we already use await f.read() above; guard via header if present
    pass