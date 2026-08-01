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

def normalize_report(raw: dict) -> Report:
    raw = raw or {}
    verdicts = []
    for v in raw.get("verdicts", []) or []:
        key = str(v.get("verdict", "")).upper()
        vk, vl = _VMAP.get(key, ("conditional", v.get("verdict", "Conditional")))
        verdicts.append(Verdict(v=vk, verdict=vl, clause=v.get("clause", "—"),
                                record=v.get("record", "—"), why=v.get("why", "")))
    scenarios = []
    for s in raw.get("scenarios", []) or []:
        scenarios.append(Scenario(icon=s.get("icon", "•"), name=s.get("name", ""),
                                  when=s.get("when", ""), payout=int(s.get("payout", 0) or 0),
                                  why=s.get("why", ""), clauses=s.get("clauses", []) or []))
    patient = raw.get("patient") or {}
    return Report(
        patient=Patient(name=patient.get("name", "Applicant"), chips=patient.get("chips", []) or []),
        score=int(raw.get("score", 50) or 50),
        verdicts=verdicts, scenarios=scenarios,
    )

def normalize_appeal(raw) -> AppealPacket:
    if isinstance(raw, dict) and "sections" in raw:
        return AppealPacket(sections=[AppealSection(**s) for s in raw["sections"]], meta=raw.get("meta", {}))
    # fallback: raw is plain text -> split into sections
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