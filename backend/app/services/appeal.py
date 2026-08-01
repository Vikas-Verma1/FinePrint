import logging
from app.services import llm
from app.models import normalize_appeal, AppealPacket
from app.db.clauses import log_appeal

log = logging.getLogger("fineprint.appeal")

def build(denial_text: str) -> AppealPacket:
    raw = llm.draft_appeal(denial_text)
    packet = normalize_appeal(raw)
    try:
        log_appeal(n_sections=len(packet.sections))
    except Exception as e:
        log.warning("appeal log skipped: %s", e)
    return packet