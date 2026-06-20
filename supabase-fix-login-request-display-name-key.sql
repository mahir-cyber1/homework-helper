alter table public.login_access_requests
add column if not exists display_name_key text;

update public.login_access_requests
set display_name_key = lower(trim(display_name))
where display_name_key is null and display_name is not null;

create unique index if not exists login_access_requests_display_name_key_unique
on public.login_access_requests (display_name_key)
where display_name_key is not null;
