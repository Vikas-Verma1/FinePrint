import logging
from app.services import llm

log = logging.getLogger("fineprint.facts")

SYS_FACTS = (
    "You extract structured consumer facts from a health-insurance policy. "
    "Return STRICT JSON only: {\"insurer\":\"...\",\"product\":\"...\",\"ped_waiting_months\":int,"
    "\"initial_waiting_days\":int,\"copay_pct\":int,\"room_rent_cap_pct\":int,\"score\":int}. "
    "Use 0 when a value is not readable. No prose."
)

def extract_facts(policy_text: str) -> dict:
    messages = [
        {"role": "system", "content": SYS_FACTS},
        {"role": "user", "content": f"POLICY TEXT:\n{policy_text[:12000]}"},
    ]
    raw, model = llm._call_with_fallback(messages, json_mode=True, temperature=0.1)
    log.info("facts.extract · used model %s", model)
    return raw if isinstance(raw, dict) else {}