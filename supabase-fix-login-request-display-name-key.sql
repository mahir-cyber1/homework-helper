alter table public.approved_login_emails
add column if not exists display_name_key text;

alter table public.login_access_requests
add column if not exists display_name_key text;

alter table public.user_profiles
add column if not exists avatar_id text not null default 'star';

alter table public.user_profiles
add column if not exists display_name_key text;

update public.approved_login_emails
set display_name_key = lower(trim(display_name))
where display_name_key is null and display_name is not null;

update public.login_access_requests
set display_name_key = lower(trim(display_name))
where display_name_key is null and display_name is not null;

update public.user_profiles
set display_name_key = lower(trim(display_name))
where display_name_key is null and display_name is not null;

update public.user_profiles
set avatar_id = 'star'
where avatar_id is null;

create unique index if not exists user_profiles_display_name_key_unique
on public.user_profiles (display_name_key)
where display_name_key is not null;

create unique index if not exists approved_login_emails_display_name_key_unique
on public.approved_login_emails (display_name_key)
where display_name_key is not null;

create unique index if not exists login_access_requests_display_name_key_unique
on public.login_access_requests (display_name_key)
where display_name_key is not null;
