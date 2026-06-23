create table if not exists public.homework_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grade text not null,
  subject text not null,
  language text not null,
  mode text not null,
  task text,
  answer text not null,
  file_name text,
  file_mime text,
  created_at timestamptz not null default now()
);

alter table public.homework_history enable row level security;

drop policy if exists "Users can read own homework history" on public.homework_history;
create policy "Users can read own homework history"
on public.homework_history
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own homework history" on public.homework_history;
create policy "Users can insert own homework history"
on public.homework_history
for insert
to authenticated
with check (auth.uid() = user_id);

create index if not exists homework_history_user_created_idx
on public.homework_history (user_id, created_at desc);

create table if not exists public.user_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  points integer not null default 0,
  correct_checks integer not null default 0,
  total_checks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  points integer not null default 0,
  event_type text not null,
  subject text,
  grade text,
  created_at timestamptz not null default now()
);

alter table public.user_points enable row level security;
alter table public.point_events enable row level security;

drop policy if exists "Users can read own points" on public.user_points;
create policy "Users can read own points"
on public.user_points
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own point events" on public.point_events;
create policy "Users can read own point events"
on public.point_events
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists point_events_user_created_idx
on public.point_events (user_id, created_at desc);

create table if not exists public.error_training (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  grade text,
  language text not null default 'de',
  original_task text,
  correction text not null,
  correct_count integer not null default 0,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.error_training enable row level security;

drop policy if exists "Users can read own error training"
on public.error_training;

create policy "Users can read own error training"
on public.error_training
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own error training"
on public.error_training;

create policy "Users can update own error training"
on public.error_training
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists error_training_user_created_idx
on public.error_training (user_id, created_at desc);
