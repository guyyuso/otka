import { supabase } from '../src/lib/supabase.js';

/**
 * Script to update a user's password.
 *
 * Usage:
 *   EMAIL=user@example.com NEW_PASSWORD=securepassword node scripts/update-password.js
 *
 * Environment variables:
 *   EMAIL - The email address of the user to update
 *   NEW_PASSWORD - The new password to set (must be at least 8 characters)
 */

async function updateUserPassword() {
  const email = process.env.EMAIL;
  const newPassword = process.env.NEW_PASSWORD;

  if (!email || !newPassword) {
    console.error('Error: EMAIL and NEW_PASSWORD environment variables are required.');
    console.error('Usage: EMAIL=user@example.com NEW_PASSWORD=securepassword node scripts/update-password.js');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    // Find user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }

    // Update password
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      console.error('Error updating password:', error);
      return;
    }

    console.log('Password updated successfully for user:', user.email);

  } catch (error) {
    console.error('Script error:', error);
  }
}

updateUserPassword();