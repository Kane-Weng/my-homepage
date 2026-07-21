-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Creates a single per-user data row plus a secure place for the Google
-- refresh token, both locked down with row-level security.

-- 1) Synced app data: one JSON blob per user.
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Each user can only read/write their own row.
drop policy if exists "own data" on public.user_data;
create policy "own data" on public.user_data
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) Google refresh token, stored server-side only.
-- No RLS policies are created, so the anon/authenticated client CANNOT read it;
-- only the Edge Function (service-role key) can. This keeps the long-lived
-- Google credential out of the browser.
create table if not exists public.google_tokens (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  refresh_token text        not null,
  updated_at    timestamptz not null default now()
);

alter table public.google_tokens enable row level security;
-- (Intentionally no policies: locked to service role.)
