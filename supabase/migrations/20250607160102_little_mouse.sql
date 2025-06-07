/*
  # Database Schema Update for Notes and File Management

  1. New Tables
    - `user_notes` - Store user personal notes with auto-save functionality
    - `user_files` - Store file metadata for user uploads
  
  2. Storage Setup
    - Create 'user-files' storage bucket for file uploads
    - Set up RLS policies for secure file access
  
  3. Security
    - Enable RLS on all new tables
    - Add policies for users to manage only their own data
    - Secure storage access with folder-based permissions
  
  4. Admin User Setup
    - Note: Admin user creation requires manual setup through Supabase Auth
*/

-- Create user_notes table
CREATE TABLE IF NOT EXISTS user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_files table
CREATE TABLE IF NOT EXISTS user_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  type text,
  url text NOT NULL,
  storage_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- User notes policies
CREATE POLICY "Users can manage own notes"
  ON user_notes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- User files policies
CREATE POLICY "Users can manage own files"
  ON user_files
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user files
DO $$
BEGIN
  -- Check if policies already exist before creating them
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

-- Add updated_at trigger for user_notes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_notes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_notes_updated_at'
  ) THEN
    CREATE TRIGGER update_user_notes_updated_at
      BEFORE UPDATE ON user_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

/*
  ADMIN USER SETUP INSTRUCTIONS:
  
  To create the admin user with email 'admin@example.com' and password '4010140':
  
  1. Go to your Supabase Dashboard
  2. Navigate to Authentication > Users
  3. Click "Add user"
  4. Enter:
     - Email: admin@example.com
     - Password: 4010140
     - Email Confirm: true
     - User Metadata: {"full_name": "System Administrator"}
  5. After creating the user, the trigger will automatically create the profile
  6. Update the profile role to 'admin' by running:
     
     UPDATE user_profiles 
     SET role = 'admin' 
     WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
*/