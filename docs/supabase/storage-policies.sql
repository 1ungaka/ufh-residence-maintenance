-- ============================================================================
-- Fault photo uploads (bucket: maintenance-files)
--
-- Fixes: "new row violates row-level security policy" when a student attaches
-- a photo to a fault. Supabase Storage blocks every upload until a policy
-- allows it.
--
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run again: it replaces its own policies.
-- ============================================================================

-- 1. Make sure the bucket exists, is readable by link (the app shows photos
--    with getPublicUrl), and only takes images up to 2 MB. The app shrinks
--    photos to about 300 KB before uploading, so 2 MB is plenty.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('maintenance-files', 'maintenance-files', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Signed-in users may upload only into a folder named after their own user id
--    (the app saves photos as <user id>/<random id>.jpg).
drop policy if exists "Fault photos: upload to own folder" on storage.objects;
create policy "Fault photos: upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'maintenance-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Users may delete their own photos (not used by the app yet, but lets a
--    student remove a photo later without needing an admin).
drop policy if exists "Fault photos: delete own" on storage.objects;
create policy "Fault photos: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'maintenance-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Nobody can overwrite someone else's photo: there is no UPDATE policy, and
-- uploads never replace an existing file.
