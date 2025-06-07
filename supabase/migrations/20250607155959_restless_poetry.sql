/*
  # Create admin user and additional tables

  1. New Tables
    - `user_notes` - User personal notes
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_files` - User uploaded files
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `name` (text)
      - `size` (bigint)
      - `type` (text)
      - `url` (text)
      - `storage_path` (text)
      - `uploaded_at` (timestamp)

  2. Admin User
    - Create admin user with email: admin@example.com
    - Password: 4010140
    - Role: admin

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
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

-- Storage policies
CREATE POLICY "Users can upload own files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create admin user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Insert into auth.users (this would normally be done through Supabase Auth)
  -- For demo purposes, we'll create the profile directly
  -- In production, you would create this user through the Supabase dashboard or Auth API
  
  -- Generate a UUID for the admin user
  admin_user_id := gen_random_uuid();
  
  -- Insert admin profile
  INSERT INTO user_profiles (id, full_name, role, status)
  VALUES (admin_user_id, 'System Administrator', 'admin', 'active')
  ON CONFLICT (id) DO NOTHING;
  
  -- Note: The actual auth user creation with email 'admin@example.com' and password '4010140'
  -- needs to be done through Supabase Auth API or dashboard
  
END $$;