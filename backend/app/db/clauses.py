import logging
from app.db.supabase import get_client

log = logging.getLogger("fineprint.db.clauses")

def save_policy(policy_hash: str, clauses: list, score: int, n_verdicts: int):
    c = get_client()
    c.table("policies").upsert({
        "policy_hash": policy_hash,
        "clauses": clauses,
        "fit_score": score,
        "n_verdicts": n_verdicts,
    }, on_conflict="policy_hash").execute()

def log_appeal(n_sections: int):
    c = get_client()
    c.table("appeals").insert({"n_sections": n_sections}).execute()