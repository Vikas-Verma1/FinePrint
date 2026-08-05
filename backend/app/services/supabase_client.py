import json
import logging
import urllib.parse
import urllib.request
from app.config import settings

log = logging.getLogger("fineprint.supabase")

def enabled() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)

def _req(method: str, path: str, body=None):
    url = settings.SUPABASE_URL.rstrip("/") + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            raw = res.read().decode()
            return json.loads(raw) if raw else None
    except Exception as e:
        log.warning("supabase %s %s failed: %s", method, path, e)
        return None

def insert_row(table: str, row: dict):
    return _req("POST", f"/rest/v1/{table}", row)

def query_rows(path_with_query: str):
    return _req("GET", path_with_query)