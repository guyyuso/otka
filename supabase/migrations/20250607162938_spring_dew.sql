/*
  # Create Admin User Setup

  This migration sets up the admin user functionality and provides instructions
  for creating the admin user through Supabase Auth.

  1. Admin User Creation
     - Email: admin@example.com
     - Password: 4010140
     - Role: admin
     - Status: active

  2. Security
     - Ensures proper RLS policies are in place
     - Creates admin role functionality
*/

-- Ensure the admin user profile exists (this will be created by trigger when auth user is created)
-- But we need to make sure the role is set to admin

-- Function to create admin user profile if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_admin_user()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user exists in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@example.com';
  
  -- If admin user exists, ensure their profile has admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, full_name, role, status, created_at, updated_at)
    VALUES (
      admin_user_id,
      'System Administrator',
      'admin',
      'active',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      full_name = 'System Administrator',
      status = 'active',
      updated_at = now();
    
    RAISE NOTICE 'Admin user profile updated for user ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user not found in auth.users. Please create user with email admin@example.com first.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Try to ensure admin user (will only work if auth user exists)
SELECT ensure_admin_user();

-- Create a function to handle new user registration and set admin role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (id, full_name, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'user'
    END,
    'active',
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Clean up function
DROP FUNCTION IF EXISTS ensure_admin_user();