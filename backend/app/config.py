from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENAI_MODEL: str = "llama-3.3-70b-versatile"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    REDIS_URL: str = "redis://localhost:6379/0"

    FRONTEND_URL: str = "http://localhost:3000"
    MAX_UPLOAD_MB: int = 25
    ANALYSIS_ASYNC_CHAR_THRESHOLD: int = 12000

    # ===== NEW (only these 4 lines added — for Telegram / WhatsApp bots) =====
    TELEGRAM_BOT_TOKEN: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "fineprint-wa-2026"
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""

settings = Settings()







# from pydantic_settings import BaseSettings, SettingsConfigDict

# class Settings(BaseSettings):
#     model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

#     OPENAI_API_KEY: str = ""
#     GROQ_API_KEY: str = ""
#     OPENAI_MODEL: str = "llama-3.3-70b-versatile"

#     SUPABASE_URL: str = ""
#     SUPABASE_SERVICE_ROLE_KEY: str = ""

#     REDIS_URL: str = "redis://localhost:6379/0"

#     FRONTEND_URL: str = "http://localhost:3000"
#     MAX_UPLOAD_MB: int = 25
#     ANALYSIS_ASYNC_CHAR_THRESHOLD: int = 12000

# settings = Settings()