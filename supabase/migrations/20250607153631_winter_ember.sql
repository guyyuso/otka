/*
  # Fix user registration database integration

  1. Database Functions
    - `handle_new_user()` - Automatically creates user profile when auth user is created
    - `update_updated_at_column()` - Updates the updated_at timestamp

  2. Triggers
    - Trigger on auth.users table to automatically create user profile
    - Trigger on user_profiles table to update timestamp

  3. Security
    - Ensure RLS policies allow profile creation
    - Handle edge cases and errors gracefully
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'משתמש חדש'),
    'user',
    'active'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure the trigger exists on user_profiles for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure service role can insert profiles (for the trigger)
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
CREATE POLICY "Service role can insert profiles"
  ON user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);