import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'secureapps',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

export const initDatabase = async () => {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500),
        logo_url VARCHAR(500),
        username VARCHAR(255),
        password VARCHAR(255),
        category VARCHAR(100) DEFAULT 'General',
        last_used TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sessions table for token management
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create files table
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        size BIGINT,
        type VARCHAR(100),
        url TEXT,
        storage_path VARCHAR(500),
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create system_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default settings if not exists
    await client.query(`
      INSERT INTO system_settings (key, value)
      VALUES 
        ('general', '{"maintenanceMode": false, "allowRegistration": true}'),
        ('security', '{"maxLoginAttempts": 5, "sessionTimeout": 60}')
      ON CONFLICT (key) DO NOTHING
    `);

    // --- RBAC & Application Tiles Tables ---

    // 1. Enhanced Users Table (Add username if not exists)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN 
          ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE; 
        END IF; 
      END $$;
    `);

    // 2. Roles Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // 3. Permissions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // 4. Role-Permission Mapping
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // 5. Global Application Tiles Catalog
    await client.query(`
      CREATE TABLE IF NOT EXISTS application_tiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        logo_url TEXT,
        launch_url TEXT NOT NULL,
        auth_type VARCHAR(50) DEFAULT 'none',
        config JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 6. User App Assignments (with encrypted credentials)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_app_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        app_tile_id UUID REFERENCES application_tiles(id) ON DELETE CASCADE,
        encrypted_credentials JSONB,
        app_username VARCHAR(255),
        pin_hash VARCHAR(255),
        requires_pin BOOLEAN DEFAULT true,
        assigned_by UUID REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, app_tile_id)
      )
    `);

    // Add PIN columns if they don't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_app_assignments' AND column_name='app_username') THEN 
          ALTER TABLE user_app_assignments ADD COLUMN app_username VARCHAR(255); 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_app_assignments' AND column_name='pin_hash') THEN 
          ALTER TABLE user_app_assignments ADD COLUMN pin_hash VARCHAR(255); 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_app_assignments' AND column_name='requires_pin') THEN 
          ALTER TABLE user_app_assignments ADD COLUMN requires_pin BOOLEAN DEFAULT true; 
        END IF;
      END $$;
    `);

    // 6.5 PIN Attempts table for rate limiting
    await client.query(`
      CREATE TABLE IF NOT EXISTS pin_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        app_tile_id UUID REFERENCES application_tiles(id) ON DELETE CASCADE,
        attempted_at TIMESTAMP DEFAULT NOW(),
        success BOOLEAN DEFAULT false
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pin_attempts_user_app ON pin_attempts(user_id, app_tile_id, attempted_at);
    `);

    // 7. Audit Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // --- Seeding RBAC Data ---

    // Seed Roles
    await client.query(`
      INSERT INTO roles (name, description) VALUES
      ('super_admin', 'Full system access'),
      ('admin', 'Administrative access with restrictions'),
      ('user', 'Standard user access')
      ON CONFLICT (name) DO NOTHING
    `);

    // Seed Permissions
    const permissions = [
      // User Management
      { slug: 'users.view', description: 'View user list and details' },
      { slug: 'users.create', description: 'Create new users' },
      { slug: 'users.edit', description: 'Edit user details' },
      { slug: 'users.delete', description: 'Delete or suspend users' },
      { slug: 'users.manage_roles', description: 'Change user roles' },
      { slug: 'users.reset_password', description: 'Reset user passwords' },
      // App Management
      { slug: 'apps.view', description: 'View application catalog' },
      { slug: 'apps.manage', description: 'Create/Edit/Delete application tiles' },
      { slug: 'apps.assign', description: 'Assign apps to users' },
      { slug: 'apps.view_credentials', description: 'View cleartext credentials' },
      // System
      { slug: 'system.settings', description: 'Access global system settings' },
      { slug: 'system.audit', description: 'View audit logs' }
    ];

    for (const perm of permissions) {
      await client.query(`
        INSERT INTO permissions (slug, description) 
        VALUES ($1, $2) 
        ON CONFLICT (slug) DO NOTHING
      `, [perm.slug, perm.description]);
    }

    // Assign Permissions to Roles (Basic Logic)
    // Super Admin: All permissions
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'super_admin'
      ON CONFLICT DO NOTHING
    `);

    // Admin: Users (View, Create, Edit, Reset), Apps (View, Assign)
    // Exclude: users.delete (soft restriction), users.manage_roles (restricted), apps.manage (restricted), system.*
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'admin' AND p.slug IN (
        'users.view', 'users.create', 'users.edit', 'users.reset_password',
        'apps.view', 'apps.assign'
      )
      ON CONFLICT DO NOTHING
    `);

    console.log('Database tables created successfully');
  } finally {
    client.release();
  }
};

export default pool;
