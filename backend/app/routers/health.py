from fastapi import APIRouter
from app.config import settings

router = APIRouter()


@router.get("/api/health")
def health():
    has_llm = bool(settings.OPENAI_API_KEY or settings.GROQ_API_KEY)

    provider = None
    if settings.GROQ_API_KEY:
        provider = "groq"
    elif settings.OPENAI_API_KEY:
        provider = "openai"

    return {
        "status": "ok",
        "llm": has_llm,
        "provider": provider,
        "openai": has_llm,  # kept so older frontend code also shows LIVE
        "model": settings.OPENAI_MODEL,
        "supabase": bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY),
        "redis": False,
    }








# from fastapi import APIRouter
# from app.config import settings

# router = APIRouter()

# @router.get("/api/health")
# def health():
#     redis_ok = False
#     try:
#         from app.services.jobs import _sender
#         _sender.connection.ping()  # best-effort
#         redis_ok = True
#     except Exception:
#         redis_ok = False
#     return {
#         "status": "ok",
#         "openai": bool(settings.OPENAI_API_KEY or settings.GROQ_API_KEY),
#         "model": settings.OPENAI_MODEL,
#         "supabase": bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY),
#         "redis": redis_ok,
#     }