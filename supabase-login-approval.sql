create table if not exists public.approved_login_emails (
  email text primary key,
  display_name text,
  display_name_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.login_access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  display_name_key text,
  token text not null unique,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table public.approved_login_emails
add column if not exists display_name text;

alter table public.approved_login_emails
add column if not exists display_name_key text;

alter table public.login_access_requests
add column if not exists display_name text;

alter table public.login_access_requests
add column if not exists display_name_key text;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  display_name_key text,
  avatar_id text not null default 'star',
  grade_level text not null default '4',
  frame_id text not null default 'none',
  theme_id text not null default 'blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
add column if not exists avatar_id text not null default 'star';

alter table public.user_profiles
add column if not exists display_name_key text;

alter table public.user_profiles
add column if not exists grade_level text not null default '4';

alter table public.user_profiles
add column if not exists frame_id text not null default 'none';

alter table public.user_profiles
add column if not exists theme_id text not null default 'blue';

update public.user_profiles
set display_name_key = lower(trim(display_name))
where display_name_key is null;

update public.approved_login_emails
set display_name_key = lower(trim(display_name))
where display_name_key is null and display_name is not null;

update public.login_access_requests
set display_name_key = lower(trim(display_name))
where display_name_key is null and display_name is not null;

alter table public.approved_login_emails enable row level security;
alter table public.login_access_requests enable row level security;
alter table public.user_profiles enable row level security;

drop policy if exists "No direct client access to approved emails"
on public.approved_login_emails;

drop policy if exists "No direct client access to login requests"
on public.login_access_requests;

create index if not exists login_access_requests_token_idx
on public.login_access_requests (token);

create unique index if not exists user_profiles_display_name_key_unique
on public.user_profiles (display_name_key)
where display_name_key is not null;

create unique index if not exists approved_login_emails_display_name_key_unique
on public.approved_login_emails (display_name_key)
where display_name_key is not null;

create unique index if not exists login_access_requests_display_name_key_unique
on public.login_access_requests (display_name_key)
where display_name_key is not null;

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
