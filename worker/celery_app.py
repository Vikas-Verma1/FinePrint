import os
from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("fineprint", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    task_serializer="json", result_serializer="json", accept_content=["json"],
    timezone="UTC", task_track_started=True, imports=["worker.tasks"],
)