
-- Create storage bucket for brief attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brief-files', 'brief-files', true, 52428800, ARRAY[
  'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
  'application/pdf',
  'image/vnd.adobe.photoshop','application/x-photoshop',
  'application/postscript','image/x-eps',
  'application/illustrator',
  'video/mp4','video/quicktime',
  'application/zip','application/x-rar-compressed',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

-- Allow anyone to upload files (no auth required, like briefs table)
CREATE POLICY "Anyone can upload brief files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'brief-files');

-- Allow anyone to read brief files
CREATE POLICY "Anyone can read brief files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'brief-files');
