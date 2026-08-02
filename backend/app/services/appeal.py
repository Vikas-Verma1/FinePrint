import logging
from app.services import llm
from app.models import normalize_appeal, AppealPacket

log = logging.getLogger("fineprint.appeal")

def build(denial_text: str) -> AppealPacket:
    raw = llm.draft_appeal(denial_text)
    packet = normalize_appeal(raw)
    return packet