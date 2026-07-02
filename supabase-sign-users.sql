create table if not exists public.sign_app_users (
  username_key text primary key,
  username text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  role text not null default 'user' check (role in ('admin', 'user')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sign_app_users enable row level security;

drop policy if exists "No direct client access to sign app users"
  on public.sign_app_users;

create index if not exists sign_app_users_auth_user_idx
  on public.sign_app_users (auth_user_id);
