-- ============================================================
-- APA CRM — Build 2 (all)
-- Orders + activity_log. People and Contacts already exist.
--
-- Run against the APA project (nzhoquaiuejhkpdyhegw) only.
-- ============================================================

-- ------------------------------------------------------------
-- Orders — what people bought
-- ------------------------------------------------------------
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.people(id) on delete cascade,
  product_name text not null,
  amount_cents integer not null,
  currency     text not null default 'AUD',
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),

  constraint orders_status_valid check (
    status in ('pending','paid','refunded','cancelled')
  ),
  constraint orders_amount_sane check (amount_cents >= 0)
);

create index if not exists orders_person_id_idx  on public.orders(person_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- ------------------------------------------------------------
-- activity_log — one row per status change on a contacts row
-- ------------------------------------------------------------
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  person_id   uuid not null references public.people(id)   on delete cascade,
  from_status text,
  to_status   text not null,
  actor       text,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_contact_id_idx on public.activity_log(contact_id);
create index if not exists activity_log_person_id_idx  on public.activity_log(person_id);
create index if not exists activity_log_created_at_idx on public.activity_log(created_at desc);

-- ------------------------------------------------------------
-- Same posture as Build 1: RLS on, no policies. Only server
-- code holding the service key gets through.
-- ------------------------------------------------------------
alter table public.orders       enable row level security;
alter table public.activity_log enable row level security;
