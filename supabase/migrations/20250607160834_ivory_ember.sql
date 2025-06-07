/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Problem
    - Current admin policies cause infinite recursion by querying user_profiles table within the policy itself
    - This creates a circular dependency when evaluating RLS policies

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that avoid recursive queries
    - Use direct auth.uid() checks instead of subqueries to user_profiles table

  3. Security Changes
    - Maintain same security model but with non-recursive implementation
    - Users can still only access their own profiles
    - Admin functionality will need to be handled differently (through service role or separate approach)
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Service role policy for system operations
CREATE POLICY "Service role can manage all profiles"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: Admin functionality will need to be handled through service role
-- or by implementing admin checks in application logic rather than RLS policies