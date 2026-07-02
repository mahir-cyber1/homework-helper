create table if not exists public.sign_training_examples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  text text not null,
  features jsonb not null,
  duration_ms integer not null default 0,
  source text not null default 'webcam-correction',
  created_at timestamptz not null default now()
);

alter table public.sign_training_examples enable row level security;

drop policy if exists "Users can read own sign training examples"
  on public.sign_training_examples;
drop policy if exists "Users can insert own sign training examples"
  on public.sign_training_examples;
drop policy if exists "Users can delete own sign training examples"
  on public.sign_training_examples;

create policy "Users can read own sign training examples"
  on public.sign_training_examples
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own sign training examples"
  on public.sign_training_examples
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own sign training examples"
  on public.sign_training_examples
  for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists sign_training_examples_user_created_idx
  on public.sign_training_examples (user_id, created_at desc);
