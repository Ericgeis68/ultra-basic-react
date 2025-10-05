-- Create buildings storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('buildings', 'buildings', true, 52428800, ARRAY['image/*']);

-- Enable RLS on storage.objects for the buildings bucket
CREATE POLICY "Public read access for buildings images"
ON storage.objects FOR SELECT
USING (bucket_id = 'buildings');

CREATE POLICY "Authenticated users can upload buildings images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'buildings' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update buildings images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'buildings' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete buildings images"
ON storage.objects FOR DELETE
USING (bucket_id = 'buildings' AND auth.role() = 'authenticated');