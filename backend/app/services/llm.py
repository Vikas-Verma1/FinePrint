import json, re, logging
from openai import OpenAI
from app.config import settings

log = logging.getLogger("fineprint.llm")

def _client():
    # If Groq key exists, use Groq's free servers (OpenAI compatible)
    if settings.GROQ_API_KEY:
        return OpenAI(
            api_key=settings.GROQ_API_KEY, 
            base_url="https://api.groq.com/openai/v1"
        )
    # Otherwise fall back to OpenAI
    if settings.OPENAI_API_KEY:
        return OpenAI(api_key=settings.OPENAI_API_KEY)
    
    raise RuntimeError("No API key set. Add GROQ_API_KEY or OPENAI_API_KEY to .env")

SYS_EXTRACT = (
    "You are FinePrint, a rigorous health-insurance policy analyst. Analyze the insurance "
    "policy text against the applicant's medical records. Return STRICT JSON with this exact shape: "
    '{"patient":{"name":"(use \\"Applicant\\" if unknown)","chips":["age/condition strings"]},'
    '"score":0-100 overall policy fit,'
    '"verdicts":[{"clause":"section reference + clause text","record":"matching item from records, or —",'
    '"verdict":"COVERED|CONDITIONAL|CAPPED|EXCLUDED","why":"2-3 sentence plain-language explanation with concrete numbers"}],'
    '"scenarios":[{"icon":"emoji","name":"scenario","when":"Year N","payout":0-100,"why":"reasoning","clauses":["§ref"]}]} '
    "— include 4-6 verdicts and exactly 3 scenarios. Every verdict must cite a real clause from the policy text."
)

SYS_APPEAL = (
    "You are a patient advocate drafting a formal health-insurance appeal letter. From the denial "
    "letter: (1) identify the clause the insurer cited, (2) argue why it was misapplied or contradicts "
    "the policy's own language, (3) cite medical necessity, (4) request specific relief. Return STRICT JSON: "
    '{"sections":[{"h":"UPPERCASE section header","p":["paragraph",...],"quote":"optional quoted policy text","p2":["optional follow-up paragraphs"]}]} '
    "Tone: firm, factual, professional. Note in the final section it is a draft for patient review."
)

def _strip_fence(s: str) -> str:
    s = s.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?", "", s)
        s = re.sub(r"```$", "", s)
    return s.strip()

def extract_report(policy_text: str, records_text: str) -> dict:
    res = _client().chat.completions.create(
        model=settings.OPENAI_MODEL, temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYS_EXTRACT},
            {"role": "user", "content": f"POLICY TEXT:\n{policy_text or '(none)'}\n\nMEDICAL RECORDS:\n{records_text or '(none)'}"},
        ],
    )
    return json.loads(_strip_fence(res.choices[0].message.content))

def draft_appeal(denial_text: str):
    res = _client().chat.completions.create(
        model=settings.OPENAI_MODEL, temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYS_APPEAL},
            {"role": "user", "content": f"DENIAL LETTER:\n{denial_text}"},
        ],
    )
    raw = json.loads(_strip_fence(res.choices[0].message.content))
    return raw