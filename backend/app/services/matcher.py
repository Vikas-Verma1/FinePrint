import logging
from app.services import llm
from app.models import normalize_report, Report

log = logging.getLogger("fineprint.matcher")

def analyze(policy_text: str, records_text: str) -> Report:
    raw = llm.extract_report(policy_text, records_text)
    report = normalize_report(raw)
    return report