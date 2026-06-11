-- Migration: server-side Google Calendar sync.
-- Run this in the Supabase SQL Editor (safe to re-run).

create table if not exists public.google_tokens (
  user_id uuid primary key references auth.users on delete cascade,
  refresh_token text not null,
  updated_at timestamptz default now()
);

-- RLS on, with NO policies: clients can never read these tokens.
-- Only the server (service role key) reads/writes this table.
alter table public.google_tokens enable row level security;
