-- Supabase Storage Setup & Row-Level Security (RLS) Policies
-- Run this script in your Supabase SQL Editor or via CLI migrations.

-- 1. Create the Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('heatmaps', 'heatmaps', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policies for 'evidence' Bucket

-- A. Allow the backend service role to insert/upload documents
CREATE POLICY "Allow backend to upload evidence"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'evidence');

-- B. Allow the backend service role to view documents
CREATE POLICY "Allow backend to view evidence"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'evidence');

-- C. Allow authenticated Reviewer Officers to view evidence for audits
CREATE POLICY "Allow authenticated officers to view evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence' AND
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'officer'
);

-- 4. Policies for 'heatmaps' Bucket

-- A. Allow the backend service role to insert/upload heatmaps
CREATE POLICY "Allow backend to upload heatmaps"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'heatmaps');

-- B. Allow the backend service role to view heatmaps
CREATE POLICY "Allow backend to view heatmaps"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'heatmaps');

-- C. Allow authenticated Reviewer Officers to view heatmaps for audits
CREATE POLICY "Allow authenticated officers to view heatmaps"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'heatmaps' AND
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'officer'
);
