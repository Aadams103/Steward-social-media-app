-- Steward schema foundation (part 8): storage buckets with org-scoped paths.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('brand-assets', 'brand-assets', false, 5242880, array['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']),
  ('content-media', 'content-media', false, 104857600, array['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm','audio/mpeg','audio/wav']),
  ('generated-media', 'generated-media', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('thumbnails', 'thumbnails', false, 2097152, array['image/jpeg','image/png','image/webp']),
  ('imports', 'imports', false, 52428800, array['image/jpeg','image/png','video/mp4','application/pdf','text/plain','text/csv']),
  ('exports', 'exports', false, 104857600, array['application/zip','application/pdf','text/csv','application/json'])
on conflict (id) do nothing;

-- Path convention: {bucket}/{organization_id}/{brand_id?}/{asset_id?}/{filename}
create or replace function public.storage_object_in_user_org(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.role() = 'service_role'
    or (
      auth.role() = 'authenticated'
      and split_part(object_name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and public.is_org_member(split_part(object_name, '/', 1)::uuid)
    );
$$;

revoke all on function public.storage_object_in_user_org(text) from public;
grant execute on function public.storage_object_in_user_org(text) to authenticated;

-- brand-assets
drop policy if exists "Org members read brand-assets" on storage.objects;
create policy "Org members read brand-assets"
  on storage.objects for select
  using (bucket_id = 'brand-assets' and public.storage_object_in_user_org(name));

drop policy if exists "Org editors upload brand-assets" on storage.objects;
create policy "Org editors upload brand-assets"
  on storage.objects for insert
  with check (bucket_id = 'brand-assets' and public.storage_object_in_user_org(name));

drop policy if exists "Org editors update brand-assets" on storage.objects;
create policy "Org editors update brand-assets"
  on storage.objects for update
  using (bucket_id = 'brand-assets' and public.storage_object_in_user_org(name));

drop policy if exists "Org editors delete brand-assets" on storage.objects;
create policy "Org editors delete brand-assets"
  on storage.objects for delete
  using (bucket_id = 'brand-assets' and public.storage_object_in_user_org(name));

-- content-media
drop policy if exists "Org members read content-media" on storage.objects;
create policy "Org members read content-media"
  on storage.objects for select
  using (bucket_id = 'content-media' and public.storage_object_in_user_org(name));

drop policy if exists "Org editors upload content-media" on storage.objects;
create policy "Org editors upload content-media"
  on storage.objects for insert
  with check (bucket_id = 'content-media' and public.storage_object_in_user_org(name));

drop policy if exists "Org editors update content-media" on storage.objects;
create policy "Org editors update content-media"
  on storage.objects for update
  using (bucket_id = 'content-media' and public.storage_object_in_user_org(name));

drop policy if exists "Org editors delete content-media" on storage.objects;
create policy "Org editors delete content-media"
  on storage.objects for delete
  using (bucket_id = 'content-media' and public.storage_object_in_user_org(name));

-- generated-media, thumbnails, imports, exports (same pattern)
do $$
declare
  b text;
begin
  foreach b in array array['generated-media','thumbnails','imports','exports']
  loop
    execute format('drop policy if exists "Org members read %1$s" on storage.objects', b);
    execute format(
      'create policy "Org members read %1$s" on storage.objects for select using (bucket_id = %2$L and public.storage_object_in_user_org(name))',
      b, b
    );
    execute format('drop policy if exists "Org editors upload %1$s" on storage.objects', b);
    execute format(
      'create policy "Org editors upload %1$s" on storage.objects for insert with check (bucket_id = %2$L and public.storage_object_in_user_org(name))',
      b, b
    );
    execute format('drop policy if exists "Org editors update %1$s" on storage.objects', b);
    execute format(
      'create policy "Org editors update %1$s" on storage.objects for update using (bucket_id = %2$L and public.storage_object_in_user_org(name))',
      b, b
    );
    execute format('drop policy if exists "Org editors delete %1$s" on storage.objects', b);
    execute format(
      'create policy "Org editors delete %1$s" on storage.objects for delete using (bucket_id = %2$L and public.storage_object_in_user_org(name))',
      b, b
    );
  end loop;
end $$;

comment on function public.storage_object_in_user_org(text) is
  'Validates storage object paths are scoped to organization_id as first path segment.';
