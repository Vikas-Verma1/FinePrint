import logging
from celery import Celery
from celery.result import AsyncResult
from app.config import settings

log = logging.getLogger("fineprint.jobs")

_sender = Celery(broker=settings.REDIS_URL, backend=settings.REDIS_URL)
_sender.conf.update(result_serializer="json", task_serializer="json", accept_content=["json"])

def enqueue(task_name: str, args: list) -> str:
    r = _sender.send_task(task_name, args=args)
    return r.id

def get_job(job_id: str) -> dict:
    r = AsyncResult(job_id, app=_sender)
    if r.state == "SUCCESS":
        return {"status": "done", "result": r.result}
    if r.state == "FAILURE":
        return {"status": "error", "error": str(r.result)}
    return {"status": "processing", "state": r.state}