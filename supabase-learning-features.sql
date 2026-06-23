alter table public.user_profiles
add column if not exists frame_id text not null default 'none';

alter table public.user_profiles
add column if not exists theme_id text not null default 'blue';

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
