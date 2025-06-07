/*
  # Add user notes, files, and admin setup

  1. New Tables
    - `user_notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `content` (text, default empty)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `name` (text, file name)
      - `size` (bigint, file size)
      - `type` (text, mime type)
      - `url` (text, public URL)
      - `storage_path` (text, storage path)
      - `uploaded_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
    - Add storage bucket and policies for file uploads

  3. Storage Setup
    - Create user-files bucket
    - Add storage policies for file management

  Note: Admin user creation is commented out as it requires auth user creation first
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

-- Create triggers for updated_at
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- Note: Admin user creation needs to be done through Supabase Auth
-- You can create an admin user with email 'admin@example.com' and password '4010140'
-- through the Supabase dashboard or Auth API, then update their role to 'admin'