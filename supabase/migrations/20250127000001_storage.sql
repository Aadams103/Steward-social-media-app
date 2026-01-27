-- Steward Storage: uploads and brand-icons buckets.
-- Policies: authenticated users (and RLS) scoped to user_id/brand_id.
-- Backend can use service role to move/transform objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('uploads', 'uploads', false, 10485760, array['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','application/pdf']),
  ('brand-icons', 'brand-icons', false, 2097152, array['image/jpeg','image/png','image/gif','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- storage.objects RLS: allow authenticated users to read/write their org-scoped objects.
-- Path convention: uploads/{org_id}/{brand_id?}/{filename}; brand-icons/{org_id}/{brand_id}/{filename}

create policy "Users can read objects in uploads for their org"
  on storage.objects for select
  using (
    bucket_id = 'uploads' and auth.role() = 'authenticated'
    -- Optional: and (storage.foldername(name))[1] in (select id::text from public.organizations o where o.owner_id = auth.uid() or exists (select 1 from public.organization_members om where om.organization_id = o.id and om.user_id = auth.uid()))
  );

create policy "Users can upload to uploads"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

create policy "Users can update their uploads"
  on storage.objects for update
  using (bucket_id = 'uploads' and auth.role() = 'authenticated');

create policy "Users can delete their uploads"
  on storage.objects for delete
  using (bucket_id = 'uploads' and auth.role() = 'authenticated');

create policy "Users can read objects in brand-icons for their org"
  on storage.objects for select
  using (bucket_id = 'brand-icons' and auth.role() = 'authenticated');

create policy "Users can upload to brand-icons"
  on storage.objects for insert
  with check (bucket_id = 'brand-icons' and auth.role() = 'authenticated');

create policy "Users can update brand-icons"
  on storage.objects for update
  using (bucket_id = 'brand-icons' and auth.role() = 'authenticated');

create policy "Users can delete brand-icons"
  on storage.objects for delete
  using (bucket_id = 'brand-icons' and auth.role() = 'authenticated');
