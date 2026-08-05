import json
import logging
import urllib.request
from fastapi import APIRouter, Request, Query
from app.config import settings
from app.services import chat_text

log = logging.getLogger("fineprint.whatsapp")
router = APIRouter()

def _send(to, text):
    url = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    data = json.dumps({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text},
    }).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    })
    try:
        urllib.request.urlopen(req, timeout=15)
    except Exception as e:
        log.warning("whatsapp send failed: %s", e)

@router.get("/api/whatsapp/webhook")
async def verify(
    hub_mode: str = Query("", alias="hub.mode"),
    hub_token: str = Query("", alias="hub.verify_token"),
    hub_challenge: str = Query("", alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_token == settings.WHATSAPP_VERIFY_TOKEN:
        return int(hub_challenge or 0)
    return {"ok": False}

@router.post("/api/whatsapp/webhook")
async def webhook(request: Request):
    if not settings.WHATSAPP_ACCESS_TOKEN:
        return {"ok": False}
    body = await request.json()
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            for m in (change.get("value") or {}).get("messages", []) or []:
                if m.get("type") == "text":
                    text = m["text"]["body"]
                    try:
                        reply = chat_text.answer(text)
                    except Exception:
                        log.exception("whatsapp answer failed")
                        reply = "Sorry, I hit an error. Try again in a moment."
                    for part in chat_text.split_msg(reply, 3500):
                        _send(m.get("from"), part)
    return {"ok": True}