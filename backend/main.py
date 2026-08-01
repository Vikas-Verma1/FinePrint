import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.security import limiter
from app.routers import health, analyze, appeal
from app.services import jobs

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

app = FastAPI(title="FinePrint API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(appeal.router)

@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    return jobs.get_job(job_id)

@app.get("/")
def root():
    return {"service": "fineprint", "docs": "/docs"}