import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let Pool;
if (process.env.USE_MEM_DB === 'true') {
  console.log('--- Using In-Memory Database (pg-mem) ---');
  const { newDb } = await import('pg-mem');
  const db = newDb();
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: db.public.getType('uuid'),
    implementation: () => '550e8400-e29b-41d4-a716-446655440000',
  });
  Pool = db.adapters.createPg().Pool;
} else {
  Pool = pg.Pool;
}

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'secureapps',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

/**
 * Robustly ensures a column exists in a table.
 */
async function ensureColumn(client, tableName, columnName, columnType, defaultValue = null) {
  const checkQuery = `
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = $1 AND column_name = $2
  `;
  const res = await client.query(checkQuery, [tableName, columnName]);
  if (res.rowCount === 0) {
    console.log(`  Adding missing column ${columnName} to ${tableName}...`);
    let query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
    if (defaultValue !== null) {
      query += ` DEFAULT ${defaultValue}`;
    }
    await client.query(query);
  }
}

export const initDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('--- Initializing Database ---');

    // 1. Core Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure all user columns exist (from various migrations)
    await ensureColumn(client, 'users', 'username', 'VARCHAR(100) UNIQUE');
    await ensureColumn(client, 'users', 'role', 'VARCHAR(50)', "'user'");
    await ensureColumn(client, 'users', 'status', 'VARCHAR(50)', "'active'");
    await ensureColumn(client, 'users', 'updated_at', 'TIMESTAMP', 'NOW()');

    await client.query(`CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL, description TEXT)`);
    await client.query(`CREATE TABLE IF NOT EXISTS permissions (id SERIAL PRIMARY KEY, slug VARCHAR(100) UNIQUE NOT NULL, description TEXT)`);
    await client.query(`CREATE TABLE IF NOT EXISTS role_permissions (role_id INT REFERENCES roles(id) ON DELETE CASCADE, permission_id INT REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY (role_id, permission_id))`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS application_tiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        launch_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure all application_tiles columns exist (Consolidated from v2, v4)
    await ensureColumn(client, 'application_tiles', 'description', 'TEXT');
    await ensureColumn(client, 'application_tiles', 'short_description', 'VARCHAR(255)');
    await ensureColumn(client, 'application_tiles', 'category', 'VARCHAR(100)');
    await ensureColumn(client, 'application_tiles', 'logo_url', 'TEXT');
    await ensureColumn(client, 'application_tiles', 'icon_url', 'TEXT');
    await ensureColumn(client, 'application_tiles', 'auth_type', 'VARCHAR(50)', "'none'");
    await ensureColumn(client, 'application_tiles', 'config', 'JSONB');
    await ensureColumn(client, 'application_tiles', 'tags', 'TEXT[]');
    await ensureColumn(client, 'application_tiles', 'publisher', 'VARCHAR(255)');
    await ensureColumn(client, 'application_tiles', 'is_available_in_store', 'BOOLEAN', 'false');
    await ensureColumn(client, 'application_tiles', 'requires_approval', 'BOOLEAN', 'false');
    await ensureColumn(client, 'application_tiles', 'status', 'VARCHAR(50)', "'active'");
    await ensureColumn(client, 'application_tiles', 'app_identifier', 'VARCHAR(255) UNIQUE');
    await ensureColumn(client, 'application_tiles', 'version', 'VARCHAR(50)');
    await ensureColumn(client, 'application_tiles', 'created_by', 'UUID REFERENCES users(id)');
    await ensureColumn(client, 'application_tiles', 'master_catalog_synced_at', 'TIMESTAMP');
    await ensureColumn(client, 'application_tiles', 'sync_status', 'VARCHAR(50)', "'pending'");
    await ensureColumn(client, 'application_tiles', 'updated_at', 'TIMESTAMP', 'NOW()');

    // Other tables
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        app_id UUID REFERENCES application_tiles(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'submitted',
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        admin_note TEXT,
        deny_reason TEXT,
        app_identifier_or_name VARCHAR(255),
        app_exists_in_store BOOLEAN DEFAULT true,
        cost_center VARCHAR(100),
        priority VARCHAR(50),
        desired_by_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Analytics (v3)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        login_at TIMESTAMP DEFAULT NOW(),
        last_activity_at TIMESTAMP DEFAULT NOW(),
        logout_at TIMESTAMP,
        presence_state VARCHAR(20) DEFAULT 'LIVE' CHECK (presence_state IN ('LIVE', 'AWAY', 'OFFLINE')),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_clicks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        app_id UUID NOT NULL,
        clicked_at TIMESTAMP DEFAULT NOW(),
        source_page VARCHAR(100)
      )
    `);

    await client.query(`CREATE TABLE IF NOT EXISTS audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID REFERENCES users(id), action VARCHAR(100) NOT NULL, target_id UUID, details JSONB, ip_address VARCHAR(45), created_at TIMESTAMP DEFAULT NOW())`);
    await client.query(`CREATE TABLE IF NOT EXISTS system_settings (key VARCHAR(50) PRIMARY KEY, value JSONB, updated_at TIMESTAMP DEFAULT NOW())`);

    // 2. Seeding RBAC
    await client.query(`INSERT INTO roles (name, description) VALUES ('super_admin', 'Full system access'), ('admin', 'Administrative access'), ('user', 'Standard user') ON CONFLICT (name) DO NOTHING`);

    const perms = [
      { slug: 'users.view', desc: 'View user list' },
      { slug: 'users.create', desc: 'Create new users' },
      { slug: 'users.edit', desc: 'Edit user details' },
      { slug: 'users.delete', desc: 'Delete users' },
      { slug: 'users.manage_roles', desc: 'Change roles' },
      { slug: 'apps.view', desc: 'View app catalog' },
      { slug: 'apps.manage', desc: 'Manage app tiles' },
      { slug: 'apps.assign', desc: 'Assign apps to users' },
      { slug: 'app_requests.read', desc: 'View app requests' },
      { slug: 'app_requests.approve', desc: 'Approve app requests' },
      { slug: 'requests.view_own', desc: 'View own requests' },
      { slug: 'requests.create', desc: 'Create app requests' },
      { slug: 'catalog.sync', desc: 'Trigger catalog sync' },
      { slug: 'system.settings', desc: 'Access settings' },
      { slug: 'system.audit', desc: 'View audit logs' }
    ];

    for (const p of perms) {
      await client.query(`INSERT INTO permissions (slug, description) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`, [p.slug, p.desc]);
    }

    // Role-Permission Assignments
    const mappings = {
      'super_admin': perms.map(p => p.slug),
      'admin': ['users.view', 'users.create', 'users.edit', 'apps.view', 'apps.assign', 'app_requests.read', 'app_requests.approve', 'requests.view_own', 'requests.create', 'catalog.sync'],
      'user': ['requests.view_own', 'requests.create', 'apps.view']
    };

    for (const [roleName, slugs] of Object.entries(mappings)) {
      for (const slug of slugs) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT r.id, p.id FROM roles r, permissions p
          WHERE r.name = $1 AND p.slug = $2
          ON CONFLICT DO NOTHING
        `, [roleName, slug]);
      }
    }

    // 3. Default Settings
    const defaultSettings = [
      ['general', '{"maintenanceMode": false, "allowRegistration": true}'],
      ['security', '{"maxLoginAttempts": 5, "sessionTimeout": 60}'],
      ['catalog_sync_frequency_hours', '"6"'],
      ['catalog_sync_enabled', '"true"']
    ];
    for (const [key, val] of defaultSettings) {
      await client.query(`INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`, [key, val]);
    }

    console.log('--- Database schema check and seeding completed ---');
  } catch (err) {
    console.error('Error during database initialization:', err);
    throw err;
  } finally {
    client.release();
  }
};

export default pool;
