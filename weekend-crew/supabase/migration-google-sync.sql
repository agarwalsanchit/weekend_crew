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

-- Signed-out invite preview: returns just the group name for an invite code.
create or replace function public.group_preview(code text)
returns table(name text) language sql stable security definer set search_path = public as
$$ select name from groups where invite_code = upper(code); $$;
grant execute on function public.group_preview(text) to anon, authenticated;

-- Group admins (creators) can remove members from their groups.
create policy "creator removes members" on public.group_members
  for delete to authenticated using (
    exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid())
  );
