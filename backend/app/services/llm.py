import json, re, logging
from openai import OpenAI, APIError, RateLimitError, APIStatusError
from app.config import settings

log = logging.getLogger("fineprint.llm")

# ---------- Multi-model fallback chain (all free on Groq) ----------
FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
]

def _get_models_to_try() -> list[str]:
    """Return the configured model first, then fallbacks (deduplicated)."""
    configured = (settings.OPENAI_MODEL or "").strip()
    out = [configured] if configured else []
    for m in FALLBACK_MODELS:
        if m not in out:
            out.append(m)
    return out

def _client():
    if settings.GROQ_API_KEY:
        return OpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    if settings.OPENAI_API_KEY:
        return OpenAI(api_key=settings.OPENAI_API_KEY)
    raise RuntimeError("No API key set. Add GROQ_API_KEY or OPENAI_API_KEY to .env")

def _strip_fence(s: str) -> str:
    s = s.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?", "", s)
        s = re.sub(r"```$", "", s)
    return s.strip()

def _call_with_fallback(messages: list, *, json_mode: bool, temperature: float) -> tuple[dict, str]:
    """Try each model in order. Return (parsed_json, model_used)."""
    client = _client()
    models = _get_models_to_try()
    last_err = None
    for model in models:
        try:
            res = client.chat.completions.create(
                model=model, temperature=temperature,
                response_format={"type": "json_object"} if json_mode else None,
                messages=messages,
            )
            raw = _strip_fence(res.choices[0].message.content)
            parsed = json.loads(raw)
            log.info("fineprint.llm · success with model %s", model)
            return parsed, model
        except json.JSONDecodeError as e:
            log.warning("fineprint.llm · %s returned invalid JSON: %s", model, e)
            last_err = e
        except RateLimitError as e:
            log.warning("fineprint.llm · %s rate-limited, trying next", model)
            last_err = e
        except APIStatusError as e:
            log.warning("fineprint.llm · %s API error %s, trying next", model, getattr(e, "status_code", ""))
            last_err = e
        except APIError as e:
            log.warning("fineprint.llm · %s API error, trying next: %s", model, e)
            last_err = e
        except Exception as e:
            log.warning("fineprint.llm · %s unexpected error: %s", model, e)
            last_err = e
    raise last_err or RuntimeError("All models failed")

# ---------- Stronger prompts (force numeric payouts) ----------

SYS_EXTRACT = (
    "You are FinePrint, an expert health-insurance policy analyst and consumer-protection advocate. "
    "You receive an insurance policy's text and, optionally, an applicant's medical records.\n\n"
    "MODE A (medical records provided): cross-reference the policy's clauses against the applicant's "
    "conditions. For each relevant clause give a verdict: COVERED (policy pays this), CONDITIONAL "
    "(pays only after a waiting period/condition), CAPPED (pays up to a sub-limit), EXCLUDED (never pays). "
    "Set 'record' to the matching condition from the records.\n\n"
    "MODE B (NO medical records, or records say none): perform a STANDALONE consumer audit of the policy "
    "itself. Surface BOTH the GOOD clauses (generous coverage, day-care, no-claim bonus, ambulance cover, "
    "cashless network, etc. -> verdict COVERED, record '—') AND the BAD / trap clauses (long waiting periods, "
    "low sub-limits, exclusions, high co-pays, room-rent caps -> verdict CONDITIONAL/CAPPED/EXCLUDED, "
    "record '—'). Give a balanced mix: at least 2 good and at least 2 traps.\n\n"
    "In BOTH modes set patient.name to the policy/product name if readable (else 'Policy Audit'), and "
    "patient.chips to 3-6 short facts you can read (plan name, sum insured, co-pay %, waiting periods; if "
    "none readable use ['Standalone policy audit','No medical records provided']). score = 0-100 overall "
    "consumer-friendliness of the policy (in MODE A, the fit for THIS applicant).\n\n"
    "*** CRITICAL TYPE RULES ***\n"
    "- 'payout' MUST be an integer between 0 and 100 (e.g. 42, 75, 90). NEVER a string, never text like 'up to X rupees'.\n"
    "- 'score' MUST be an integer between 0 and 100.\n"
    "- Return ONLY valid JSON. No prose outside the JSON object.\n\n"
    "Return STRICT JSON exactly: {\"patient\":{\"name\":\"...\",\"chips\":[...]},\"score\":0-100,"
    "\"verdicts\":[{\"clause\":\"§ref — short clause text\",\"record\":\"matching condition or —\","
    "\"verdict\":\"COVERED|CONDITIONAL|CAPPED|EXCLUDED\",\"why\":\"2-3 plain-language sentences with concrete numbers\"}],"
    "\"scenarios\":[{\"icon\":\"emoji\",\"name\":\"...\",\"when\":\"Year N\",\"payout\":0-100,\"why\":\"...\",\"clauses\":[\"§ref\"]}]}. "
    "Provide 5-8 verdicts and exactly 3 scenarios. Cite real section numbers from the text when present."
)

SYS_APPEAL = (
    "You are a patient advocate drafting a formal health-insurance appeal letter. From the denial "
    "letter: (1) identify the clause the insurer cited, (2) argue why it was misapplied or contradicts "
    "the policy's own language, (3) cite medical necessity, (4) request specific relief. Return STRICT JSON: "
    '{"sections":[{"h":"UPPERCASE section header","p":["paragraph",...],"quote":"optional quoted policy text","p2":["optional follow-up paragraphs"]}]} '
    "Tone: firm, factual, professional. Note in the final section it is a draft for patient review."
)

def extract_report(policy_text: str, records_text: str) -> tuple[dict, str]:
    rec = (records_text or "").strip()
    mode_hint = "" if rec else "\n\nNOTE: No medical records were provided. Operate in MODE B (standalone consumer audit of the policy)."
    messages = [
        {"role": "system", "content": SYS_EXTRACT},
        {"role": "user", "content": f"POLICY TEXT:\n{policy_text or '(none)'}\n\nMEDICAL RECORDS:\n{rec or '(none)'}{mode_hint}"},
    ]
    return _call_with_fallback(messages, json_mode=True, temperature=0.2)

def draft_appeal(denial_text: str) -> tuple[dict, str]:
    messages = [
        {"role": "system", "content": SYS_APPEAL},
        {"role": "user", "content": f"DENIAL LETTER:\n{denial_text}"},
    ]
    return _call_with_fallback(messages, json_mode=True, temperature=0.3)