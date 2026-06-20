create table if not exists public.approved_login_emails (
  email text primary key,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.login_access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  token text not null unique,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table public.approved_login_emails
add column if not exists display_name text;

alter table public.login_access_requests
add column if not exists display_name text;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_id text not null default 'star',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
add column if not exists avatar_id text not null default 'star';

alter table public.approved_login_emails enable row level security;
alter table public.login_access_requests enable row level security;
alter table public.user_profiles enable row level security;

drop policy if exists "No direct client access to approved emails"
on public.approved_login_emails;

drop policy if exists "No direct client access to login requests"
on public.login_access_requests;

create index if not exists login_access_requests_token_idx
on public.login_access_requests (token);

drop policy if exists "Users can read own profile"
on public.user_profiles;

create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile"
on public.user_profiles;

create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile"
on public.user_profiles;

create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
