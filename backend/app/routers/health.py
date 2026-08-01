from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/api/health")
def health():
    redis_ok = False
    try:
        from app.services.jobs import _sender
        _sender.connection.ping()  # best-effort
        redis_ok = True
    except Exception:
        redis_ok = False
    return {
        "status": "ok",
        "openai": bool(settings.OPENAI_API_KEY),
        "model": settings.OPENAI_MODEL,
        "supabase": bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY),
        "redis": redis_ok,
    }