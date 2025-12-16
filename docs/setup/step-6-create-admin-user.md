# Step 6: Create Admin User

## Create the Admin User

1. Go to your Supabase Dashboard
2. Click **Authentication** in the left sidebar
3. Click **Users** tab
4. Click **"Add user"** button (top right)
5. Fill in the form:

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | Choose a strong password (min 8 characters) |
| Auto Confirm User | Check this box |

6. Click **"Create user"**

## Verify Admin Role

The trigger we created in Step 5 automatically assigns the admin role to `admin@example.com`.

To verify:

1. Go to **Table Editor**
2. Click on **user_profiles**
3. Find the row with your admin email
4. Check that the `role` column shows `admin`

## Using a Different Admin Email

If you want to use a different email for your admin account:

1. Create the user with your preferred email
2. Go to **SQL Editor**
3. Run this query (replace the email):

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

## Checklist

- [ ] Admin user created in Supabase Auth
- [ ] User profile created in user_profiles table
- [ ] Role is set to 'admin'

## Next Step

Proceed to [Step 7: Run the Application](step-7-run-application.md)
