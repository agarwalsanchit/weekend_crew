-- Weekend Crew schema. Run this in Supabase SQL Editor (one shot).
create extension if not exists pgcrypto;

-- ---------- tables ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  emoji text not null default '🙂',
  color text not null default 'bg-teal-400',
  created_at timestamptz default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default 'San Francisco Bay Area',
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

create table public.group_members (
  group_id uuid references public.groups on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table public.availability (
  group_id uuid references public.groups on delete cascade,
  user_id uuid references auth.users on delete cascade,
  weekend_key text not null, -- ISO date of the Saturday, e.g. 2026-06-13
  status text not null check (status in ('free', 'busy', 'traveling')),
  comment text,
  updated_at timestamptz default now(),
  primary key (group_id, user_id, weekend_key)
);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups on delete cascade,
  weekend_key text not null,
  type text not null default 'chill' check (type in ('concert','movie','hike','trip','chill')),
  title text not null,
  link text,
  created_by uuid references auth.users,
  frozen boolean not null default false,
  created_at timestamptz default now()
);

create table public.votes (
  suggestion_id uuid references public.suggestions on delete cascade,
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (suggestion_id, user_id)
);

-- ---------- helper ----------
create or replace function public.is_member(g uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from group_members where group_id = g and user_id = auth.uid()); $$;

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.availability enable row level security;
alter table public.suggestions enable row level security;
alter table public.votes enable row level security;

-- profiles: any signed-in user can read; you manage your own
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());

-- groups: readable by signed-in users (needed for invite-code join); create your own
create policy "groups read" on public.groups for select to authenticated using (true);
create policy "groups insert" on public.groups for insert to authenticated with check (created_by = auth.uid());
create policy "groups update by creator" on public.groups for update to authenticated using (created_by = auth.uid());

-- group_members: readable by signed-in users; you join/leave yourself
create policy "members read" on public.group_members for select to authenticated using (true);
create policy "members join self" on public.group_members for insert to authenticated with check (user_id = auth.uid());
create policy "members leave self" on public.group_members for delete to authenticated using (user_id = auth.uid());

-- availability: visible to group members; you write your own
create policy "availability read" on public.availability for select to authenticated using (public.is_member(group_id));
create policy "availability upsert own" on public.availability for insert to authenticated with check (user_id = auth.uid() and public.is_member(group_id));
create policy "availability update own" on public.availability for update to authenticated using (user_id = auth.uid());
create policy "availability delete own" on public.availability for delete to authenticated using (user_id = auth.uid());

-- suggestions: visible to group members; members create; members can freeze (update)
create policy "suggestions read" on public.suggestions for select to authenticated using (public.is_member(group_id));
create policy "suggestions insert" on public.suggestions for insert to authenticated with check (created_by = auth.uid() and public.is_member(group_id));
create policy "suggestions update by members" on public.suggestions for update to authenticated using (public.is_member(group_id));
create policy "suggestions delete own" on public.suggestions for delete to authenticated using (created_by = auth.uid());

-- votes: visible to group members; you vote/unvote yourself
create policy "votes read" on public.votes for select to authenticated using (
  exists (select 1 from public.suggestions s where s.id = suggestion_id and public.is_member(s.group_id))
);
create policy "votes insert own" on public.votes for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.suggestions s where s.id = suggestion_id and public.is_member(s.group_id))
);
create policy "votes delete own" on public.votes for delete to authenticated using (user_id = auth.uid());
