-- ============================================================
-- APA CRM — Build 1 (small)
-- People + Contacts. Nothing else.
--
-- Run this against the NEW APA Supabase project only.
-- Do not run it against a project that already has a
-- public.contacts table.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- People — one row per person, deduplicated by email
-- ------------------------------------------------------------
create table if not exists public.people (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text,
  phone         text,
  company       text,
  role          text,
  source_site   text,
  ok_to_contact boolean not null default false,
  attributes    jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- APA custom attributes live in `attributes`:
  --   membership_number  text
  --   industry           text
  --   state              text, from the fixed list below
  --   modern_award       text
  constraint people_state_valid check (
    attributes->>'state' is null
    or attributes->>'state' in ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT')
  )
);

comment on column public.people.attributes is
  'APA custom attributes: membership_number (text), industry (text), state (NSW|VIC|QLD|WA|SA|TAS|ACT|NT), modern_award (text)';

create index if not exists people_attributes_idx
  on public.people using gin (attributes);

-- ------------------------------------------------------------
-- Contacts — the inquiry pipeline, each row linked to a person
-- ------------------------------------------------------------
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references public.people(id) on delete cascade,
  type       text not null,
  subject    text,
  message    text,
  source     text,
  status     text not null default 'new_lead',
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  -- APA inquiry types, exactly three
  constraint contacts_type_valid check (
    type in ('helpdesk','membership','training')
  ),
  constraint contacts_status_valid check (
    status in ('new_lead','contacted','discovery_call','proposal','won','lost')
  )
);

create index if not exists contacts_person_id_idx  on public.contacts(person_id);
create index if not exists contacts_created_at_idx on public.contacts(created_at desc);
create index if not exists contacts_status_idx     on public.contacts(status);
create index if not exists contacts_type_idx       on public.contacts(type);

-- ------------------------------------------------------------
-- Keep people.updated_at honest
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
--
-- RLS is ON with NO policies. That is deliberate:
--   - the anon key (browser) can read and write nothing
--   - the service_role key (server only) bypasses RLS
-- All database access goes through Next.js server code.
-- ------------------------------------------------------------
alter table public.people   enable row level security;
alter table public.contacts enable row level security;
