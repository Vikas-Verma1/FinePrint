1. Create a project at supabase.com → Settings → API → copy URL + service_role key.
2. Open the SQL Editor and run schema.sql, then (optionally) seed.sql.
3. Paste URL + service_role key into backend/.env (and the worker's env).
   The service_role key is server-side only — never put it in the frontend.
If you skip this, the app still works; persistence is just disabled.