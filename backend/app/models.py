import re
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

VerdictKind = Literal["covered", "conditional", "capped", "excluded"]

class Patient(BaseModel):
    name: str = "Applicant"
    chips: List[str] = Field(default_factory=list)

class Verdict(BaseModel):
    v: VerdictKind = "conditional"
    verdict: str = "Conditional"
    clause: str = "—"
    record: str = "—"
    why: str = ""

class Scenario(BaseModel):
    icon: str = "•"
    name: str = ""
    when: str = ""
    payout: int = 0
    why: str = ""
    clauses: List[str] = Field(default_factory=list)

class Report(BaseModel):
    patient: Patient = Field(default_factory=Patient)
    score: int = 50
    verdicts: List[Verdict] = Field(default_factory=list)
    scenarios: List[Scenario] = Field(default_factory=list)

class AppealSection(BaseModel):
    h: str
    p: List[str] = Field(default_factory=list)
    quote: Optional[str] = None
    p2: Optional[List[str]] = None

class AppealPacket(BaseModel):
    sections: List[AppealSection] = Field(default_factory=list)
    meta: dict = Field(default_factory=dict)

_VMAP = {
    "COVERED": ("covered", "Covered"),
    "CONDITIONAL": ("conditional", "Conditional"),
    "CAPPED": ("capped", "Capped"),
    "EXCLUDED": ("excluded", "Excluded"),
}

def _coerce_int(value, default: int = 0, min_val: int = 0, max_val: int = 100) -> int:
    """Best-effort int extraction from anything the AI might return.
    - int/float → round & clamp
    - "75" → 75
    - "75%" → 75
    - "Up to 5,000 rupees" → default (we can't map money to a 0-100 scale)
    - "80 percent" → 80
    """
    if value is None:
        return default
    if isinstance(value, (int, float)):
        n = int(round(value))
    elif isinstance(value, str):
        s = value.strip().lower()
        # "75%" or "75 percent"
        m = re.search(r"(\d+(?:\.\d+)?)\s*(%|percent|pct)?", s)
        if m and m.group(2):
            n = int(round(float(m.group(1))))
        else:
            # any leading number — but reject if > max_val (it's probably money, not a %)
            m2 = re.search(r"(\d+(?:\.\d+)?)", s)
            if m2:
                n = int(round(float(m2.group(1))))
                if n > max_val:
                    n = default
            else:
                n = default
    else:
        try:
            n = int(value)
        except (TypeError, ValueError):
            n = default
    if n < min_val: n = min_val
    if n > max_val: n = max_val
    return n

def normalize_report(raw: dict) -> Report:
    raw = raw or {}
    verdicts = []
    for v in raw.get("verdicts", []) or []:
        key = str(v.get("verdict", "")).upper()
        vk, vl = _VMAP.get(key, ("conditional", v.get("verdict", "Conditional")))
        verdicts.append(Verdict(
            v=vk, verdict=vl,
            clause=v.get("clause", "—"),
            record=v.get("record", "—"),
            why=v.get("why", ""),
        ))
    scenarios = []
    for s in raw.get("scenarios", []) or []:
        scenarios.append(Scenario(
            icon=s.get("icon", "•") or "•",
            name=s.get("name", "") or "",
            when=s.get("when", "") or "",
            payout=_coerce_int(s.get("payout"), default=50, min_val=0, max_val=100),
            why=s.get("why", "") or "",
            clauses=s.get("clauses", []) or [],
        ))
    patient = raw.get("patient") or {}
    score = _coerce_int(raw.get("score"), default=50, min_val=0, max_val=100)
    return Report(
        patient=Patient(
            name=patient.get("name", "Applicant") or "Applicant",
            chips=patient.get("chips", []) or [],
        ),
        score=score,
        verdicts=verdicts,
        scenarios=scenarios,
    )

def normalize_appeal(raw) -> AppealPacket:
    if isinstance(raw, dict) and "sections" in raw:
        sections = []
        for s in raw["sections"] or []:
            sections.append(AppealSection(
                h=s.get("h", ""),
                p=s.get("p", []) or [],
                quote=s.get("quote"),
                p2=s.get("p2"),
            ))
        return AppealPacket(sections=sections, meta=raw.get("meta", {}))
    text = raw if isinstance(raw, str) else str(raw)
    secs, cur = [], None
    for line in text.splitlines():
        if line.strip().isupper() and line.strip():
            if cur: secs.append(cur)
            cur = AppealSection(h=line.strip(), p=[])
        elif cur is not None and line.strip():
            cur.p.append(line.strip())
    if cur: secs.append(cur)
    if not secs: secs = [AppealSection(h="Appeal", p=[text.strip()])]
    return AppealPacket(sections=secs, meta={})