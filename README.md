# SecureApps - Secure Application Access Management

A modern, secure application access management platform built with React, TypeScript, and Supabase.

## Features

- **Secure Authentication** - Role-based access control with user and admin roles
- **Application Management** - Add, organize, and access applications with stored credentials
- **Password Management** - Securely store and manage application credentials
- **Personal Notes** - Built-in note-taking with auto-save functionality
- **File Management** - Upload, organize, and manage files securely
- **Admin Dashboard** - User management, statistics, and system overview

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React

---

## Installation

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/secureapps.git
cd secureapps
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings > API

### 4. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Database Setup

Run the following SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query):

### Step 1: Create Tables

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  logo_url text,
  username text,
  password text,
  category text DEFAULT 'general',
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
```

### Step 2: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
  ON user_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Applications policies
CREATE POLICY "Users can manage own applications"
  ON applications FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- User notes policies
CREATE POLICY "Users can manage own notes"
  ON user_notes FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- User files policies
CREATE POLICY "Users can manage own files"
  ON user_files FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

### Step 3: Create Functions and Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Step 4: Setup Storage

```sql
-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Create Admin User

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Click **"Add user"** and enter:
   - **Email**: `admin@example.com` (or your preferred admin email)
   - **Password**: Choose a strong password (minimum 8 characters)
   - **Email Confirm**: Check this box
   - **User Metadata**: `{"full_name": "System Administrator"}`
4. Click **Create user**

The trigger will automatically create a profile with admin role if the email is `admin@example.com`. For other admin emails, update the role manually:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin@email.com');
```

---

## Running the Application

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to access the application.

### Production Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppSection.tsx   # Application section display
│   ├── AppTile.tsx      # Individual app tile with credentials
│   └── Header.tsx       # Navigation header
├── contexts/            # React context providers
│   ├── AuthContext.tsx  # Authentication state
│   └── AppDataContext.tsx # Application data management
├── hooks/               # Custom React hooks
├── lib/
│   └── supabase.ts      # Supabase client configuration
├── pages/               # Page components
│   ├── admin/           # Admin pages
│   │   ├── AdminDashboard.tsx
│   │   └── UsersManagement.tsx
│   ├── Dashboard.tsx    # Main user dashboard
│   ├── DownloadsPage.tsx # File management
│   ├── LoginPage.tsx    # Authentication
│   ├── NotesPage.tsx    # Personal notes
│   └── SettingsPage.tsx # User settings
├── types.ts             # TypeScript type definitions
└── main.tsx             # Application entry point
```

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `user_profiles` | User profile data, role, and status |
| `applications` | User applications with credentials |
| `user_notes` | Personal notes with auto-save |
| `user_files` | File metadata for uploads |

### User Roles

| Role | Permissions |
|------|-------------|
| `user` | Manage own applications, notes, and files |
| `admin` | All user permissions + user management |

---

## Scripts

### Update User Password

```bash
EMAIL=user@example.com NEW_PASSWORD=newpassword node scripts/update-password.js
```

---

## Available Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

---

## Security Features

- **Row Level Security (RLS)** - Data isolation between users
- **JWT Authentication** - Secure session management via Supabase Auth
- **Role-based Access Control** - Admin and user permission levels
- **Secure File Storage** - Files stored in Supabase Storage with user-specific access

---

## Deployment

### Recommended Platforms

- **Frontend**: Netlify, Vercel, or Cloudflare Pages
- **Backend**: Supabase (managed)

### Environment Variables (Production)

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

---

## License

MIT License
