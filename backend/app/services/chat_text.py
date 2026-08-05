import logging
from app.services import llm

log = logging.getLogger("fineprint.chat_text")

SYS_CHAT = (
    "You are FinePrint AI, an insurance policy advocate. Answer briefly and plainly. "
    "If the user asks about 'my policy' but no policy text is provided, tell them to upload it on the FinePrint web app."
)

def answer(question: str, policy_text: str = "") -> str:
    system = SYS_CHAT
    if policy_text:
        system += "\n\nThe user's policy:\n<POLICY_DOCUMENT>\n" + policy_text[:12000] + "\n</POLICY_DOCUMENT>"
    client = llm._client()
    last = None
    for model in llm._get_models_to_try():
        try:
            res = client.chat.completions.create(
                model=model, temperature=0.4,
                messages=[{"role": "system", "content": system}, {"role": "user", "content": question}],
            )
            return res.choices[0].message.content or "…"
        except Exception as e:
            last = e
    raise last or RuntimeError("all models failed")

def split_msg(text: str, limit: int = 4000):
    return [text[i:i + limit] for i in range(0, len(text), limit)] or ["…"]