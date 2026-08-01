# FinePrint — production build

## 1) Secrets
- OpenAI: platform.openai.com/api-keys → create key → add $5 under Billing.
- Supabase (optional): supabase.com → run db/schema.sql → copy URL + service_role key.

## 2) Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill OPENAI_API_KEY (and Supabase if using)
uvicorn main:app --reload --port 8000

## 3) Frontend
cd frontend
npm install
cp .env.local.example .env.local
npm run dev            # http://localhost:3000

## 4) Worker + Redis (optional — long docs only)
docker compose up -d redis
cd worker
pip install -r requirements.txt
# PYTHONPATH must include the backend folder so `app.*` imports resolve:
PYTHONPATH=../backend celery -A worker.celery_app worker --loglevel=info   # Linux/Mac
# Windows (set then run):  set PYTHONPATH=..\backend  then the celery line above

## Demo resilience
No Redis  → backend runs analysis inline (sync).
No Supabase → persistence silently skipped.
No OpenAI key → backend returns 503 and the frontend auto-runs the Arjun demo.
The on-stage "Load sample" path never touches the network.