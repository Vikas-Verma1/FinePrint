import hashlib, logging
from app.services import llm
from app.models import normalize_report, Report
from app.db.clauses import save_policy

log = logging.getLogger("fineprint.matcher")

def analyze(policy_text: str, records_text: str) -> Report:
    raw = llm.extract_report(policy_text, records_text)
    report = normalize_report(raw)
    # persist to the data moat (never blocks the response on failure)
    try:
        save_policy(policy_hash=hashlib.sha256(policy_text.encode()).hexdigest()[:16],
                    clauses=[v.clause for v in report.verdicts],
                    score=report.score, n_verdicts=len(report.verdicts))
    except Exception as e:
        log.warning("clause persistence skipped: %s", e)
    return report