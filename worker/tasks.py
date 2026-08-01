import os
from worker.celery_app import celery_app

# make backend importable: worker is launched with PYTHONPATH including ../backend
from app.services import matcher, appeal  # noqa: E402

@celery_app.task(name="run_analysis", bind=True, max_retries=2)
def run_analysis(self, policy_text: str, records_text: str):
    try:
        report = matcher.analyze(policy_text or "", records_text or "")
        return {"report": report.model_dump()}
    except Exception as e:
        raise self.retry(exc=e, countdown=5)

@celery_app.task(name="run_appeal", bind=True, max_retries=2)
def run_appeal(self, denial_text: str):
    try:
        packet = appeal.build(denial_text or "")
        return {"sections": [s.model_dump() for s in packet.sections], "meta": packet.meta}
    except Exception as e:
        raise self.retry(exc=e, countdown=5)