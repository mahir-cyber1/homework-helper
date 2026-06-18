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
