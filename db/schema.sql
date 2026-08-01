-- FinePrint data moat: every parsed policy becomes a queryable asset.
create table if not exists policies (
  policy_hash   text primary key,
  clauses       jsonb not null default '[]'::jsonb,
  fit_score     int,
  n_verdicts    int,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists appeals (
  id            bigserial primary key,
  n_sections    int,
  created_at    timestamptz not null default now()
);

-- quick view: which clauses trip people up most often (your moat, queried)
create or replace view clause_frequency as
  select value::text as clause, count(*) as seen
  from policies, jsonb_array_elements_text(clauses) as value
  group by value order by seen desc;

-- keep updated_at fresh
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

drop trigger if exists trg_policies_touch on policies;
create trigger trg_policies_touch before update on policies
  for each row execute function touch_updated_at();