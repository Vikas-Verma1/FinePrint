import json
import logging
import urllib.request
from fastapi import APIRouter, Request
from app.config import settings
from app.services import chat_text

log = logging.getLogger("fineprint.telegram")
router = APIRouter()

def _send(chat_id, text):
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    data = json.dumps({"chat_id": chat_id, "text": text}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=15)
    except Exception as e:
        log.warning("telegram send failed: %s", e)

@router.post("/api/telegram/webhook")
async def webhook(request: Request):
    if not settings.TELEGRAM_BOT_TOKEN:
        return {"ok": False}
    update = await request.json()
    message = update.get("message") or {}
    text = (message.get("text") or "").strip()
    chat_id = (message.get("chat") or {}).get("id")
    if not text or not chat_id:
        return {"ok": True}
    try:
        reply = chat_text.answer(text)
    except Exception as e:
        log.exception("telegram answer failed")
        reply = "Sorry, I hit an error. Try again in a moment."
    for part in chat_text.split_msg(reply):
        _send(chat_id, part)
    return {"ok": True}