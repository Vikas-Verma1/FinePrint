import logging
from app.config import settings

log = logging.getLogger("fineprint.db")
_client = None

def get_client():
    global _client
    if _client is not None:
        return _client
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Supabase not configured")
    from supabase import create_client
    _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _client