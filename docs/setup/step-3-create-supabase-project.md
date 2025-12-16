# Step 3: Create Supabase Project

## Create New Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: SecureApps (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click **"Create new project"**
5. Wait for the project to be provisioned (1-2 minutes)

## Get Your API Keys

Once the project is ready:

1. Go to **Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Find and copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

## Save Your Keys

Keep these values safe - you'll need them in the next step:

| Key | Example |
|-----|---------|
| Project URL | `https://abcdefghijk.supabase.co` |
| anon public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Checklist

- [ ] Supabase project created
- [ ] Project URL copied
- [ ] anon public key copied
- [ ] Database password saved securely

## Next Step

Proceed to [Step 4: Environment Setup](step-4-environment-setup.md)
