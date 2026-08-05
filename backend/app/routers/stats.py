import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import supabase_client as sb
from app.services import facts as facts_svc

log = logging.getLogger("fineprint.stats")
router = APIRouter()

class ScoreboardIn(BaseModel):
    policy_text: str = ""
    device_id: str = ""
    consent: bool = False

def _int(v, default=0):
    try:
        return int(round(float(v)))
    except Exception:
        return default

@router.post("/api/scoreboard")
async def scoreboard(body: ScoreboardIn):
    if not body.consent:
        return {"ok": False, "reason": "no-consent"}
    if not sb.enabled():
        return {"ok": False, "reason": "stats-disabled"}
    if not body.policy_text.strip():
        raise HTTPException(400, "policy_text required")

    f = facts_svc.extract_facts(body.policy_text)
    row = {
        "insurer": str(f.get("insurer") or "Unknown")[:80],
        "product": str(f.get("product") or "")[:120],
        "ped_months": _int(f.get("ped_waiting_months")),
        "initial_days": _int(f.get("initial_waiting_days")),
        "copay_pct": _int(f.get("copay_pct")),
        "room_cap_pct": _int(f.get("room_rent_cap_pct")),
        "score": _int(f.get("score"), 50),
        "device_id": (body.device_id or "")[:64],
    }
    sb.insert_row("policy_stats", row)

    rows = sb.query_rows("/rest/v1/policy_stats?select=ped_months,score") or []
    total = len(rows)
    if not total:
        return {"ok": True, "total": 0, "insurer": row["insurer"], "facts": row}
    worse_ped = sum(1 for r in rows if (r.get("ped_months") or 0) < row["ped_months"])
    worse_score = sum(1 for r in rows if (r.get("score") or 0) < row["score"])
    return {
        "ok": True,
        "insurer": row["insurer"],
        "total": total,
        "ped_percentile": round(100 * worse_ped / total),
        "score_percentile": round(100 * worse_score / total),
        "facts": row,
    }