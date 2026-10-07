-- Fit is namespaced separately from other applications in this project.
create table public.fit_accounts (
 id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb,
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.fit_accounts enable row level security;
revoke all on public.fit_accounts from anon, authenticated;
grant select on public.fit_accounts to authenticated;
grant all on public.fit_accounts to service_role;
create policy fit_account_read on public.fit_accounts for select to authenticated using ((select auth.uid())=id);
-- Writes are performed only by fit-api after verified auth and validation.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('fit-private','fit-private',false,26214400,array['image/jpeg','video/mp4','video/webm','video/quicktime']);
create policy fit_media_read on storage.objects for select to authenticated using (bucket_id='fit-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy fit_media_insert on storage.objects for insert to authenticated with check (bucket_id='fit-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy fit_media_delete on storage.objects for delete to authenticated using (bucket_id='fit-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
