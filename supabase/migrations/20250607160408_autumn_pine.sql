/*
  # Storage bucket and policies setup

  1. Storage Setup
    - Create storage bucket for user files
    - Add storage policies for file management

  2. Notes
    - Tables and policies already exist from previous migrations
    - This migration only adds missing storage components
*/

-- Create storage bucket for user files (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (create only if they don't exist)
DO $$
BEGIN
  -- Check and create upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload own files'
  ) THEN
    CREATE POLICY "Users can upload own files"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Check and create view policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view own files'
  ) THEN
    CREATE POLICY "Users can view own files"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Check and create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own files'
  ) THEN
    CREATE POLICY "Users can delete own files"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Note: Admin user creation needs to be done through Supabase Auth
-- You can create an admin user with email 'admin@example.com' and password '4010140'
-- through the Supabase dashboard or Auth API, then update their role to 'admin'