import { supabase } from '../src/lib/supabase.js';

async function updateUserPassword() {
  try {
    // Find user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.users.find(u => u.email === 'guyyuso@gmail.com');
    
    if (!user) {
      console.error('User with email guyyuso@gmail.com not found');
      return;
    }

    // Update password
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: '4010140' }
    );

    if (error) {
      console.error('Error updating password:', error);
      return;
    }

    console.log('Password updated successfully for user:', user.email);
    console.log('New password: 4010140');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

updateUserPassword();