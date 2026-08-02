import logging
from app.services import llm
from app.models import normalize_appeal, AppealPacket

log = logging.getLogger("fineprint.appeal")

def build(denial_text: str) -> AppealPacket:
    raw, model_used = llm.draft_appeal(denial_text)
    log.info("appeal.build · used model %s", model_used)
    return normalize_appeal(raw)