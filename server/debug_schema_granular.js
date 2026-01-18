import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'secureapps',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

const debug = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting granular schema debug...');

        const steps = [
            { name: 'users', query: 'CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, full_name VARCHAR(255) NOT NULL, username VARCHAR(100) UNIQUE, role VARCHAR(50) DEFAULT \'user\', status VARCHAR(50) DEFAULT \'active\', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())' },
            { name: 'roles', query: 'CREATE TABLE IF NOT EXISTS roles (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL, description TEXT)' },
            { name: 'permissions', query: 'CREATE TABLE IF NOT EXISTS permissions (id SERIAL PRIMARY KEY, slug VARCHAR(100) UNIQUE NOT NULL, description TEXT)' },
            { name: 'role_permissions', query: 'CREATE TABLE IF NOT EXISTS role_permissions (role_id INT REFERENCES roles(id) ON DELETE CASCADE, permission_id INT REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY (role_id, permission_id))' },
            { name: 'sessions', query: 'CREATE TABLE IF NOT EXISTS sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, token VARCHAR(500) NOT NULL, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT NOW())' },
            { name: 'application_tiles', query: 'CREATE TABLE IF NOT EXISTS application_tiles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(255) NOT NULL, description TEXT, short_description VARCHAR(255), category VARCHAR(100), logo_url TEXT, icon_url TEXT, launch_url TEXT NOT NULL, auth_type VARCHAR(50) DEFAULT \'none\', config JSONB, tags TEXT[], publisher VARCHAR(255), is_available_in_store BOOLEAN DEFAULT false, requires_approval BOOLEAN DEFAULT false, status VARCHAR(50) DEFAULT \'active\', app_identifier VARCHAR(255) UNIQUE, version VARCHAR(50), created_by UUID REFERENCES users(id), master_catalog_synced_at TIMESTAMP, sync_status VARCHAR(50) DEFAULT \'pending\', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())' },
            { name: 'user_app_assignments', query: 'CREATE TABLE IF NOT EXISTS user_app_assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, app_tile_id UUID REFERENCES application_tiles(id) ON DELETE CASCADE, encrypted_credentials JSONB, app_username VARCHAR(255), pin_hash VARCHAR(255), requires_pin BOOLEAN DEFAULT true, assigned_by UUID REFERENCES users(id), assigned_at TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, app_tile_id))' },
            { name: 'app_requests', query: 'CREATE TABLE IF NOT EXISTS app_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, app_id UUID REFERENCES application_tiles(id) ON DELETE CASCADE, reason TEXT NOT NULL, status VARCHAR(50) DEFAULT \'submitted\', reviewed_by UUID REFERENCES users(id), reviewed_at TIMESTAMP, admin_note TEXT, deny_reason TEXT, app_identifier_or_name VARCHAR(255), app_exists_in_store BOOLEAN DEFAULT true, cost_center VARCHAR(100), priority VARCHAR(50), desired_by_date DATE, notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())' },
            { name: 'app_request_history', query: 'CREATE TABLE IF NOT EXISTS app_request_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), request_id UUID NOT NULL REFERENCES app_requests(id) ON DELETE CASCADE, status VARCHAR(50) NOT NULL, changed_by UUID REFERENCES users(id), note TEXT, created_at TIMESTAMP DEFAULT NOW())' },
            { name: 'audit_logs', query: 'CREATE TABLE IF NOT EXISTS audit_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID REFERENCES users(id), action VARCHAR(100) NOT NULL, target_id UUID, details JSONB, ip_address VARCHAR(45), created_at TIMESTAMP DEFAULT NOW())' },
            { name: 'system_settings', query: 'CREATE TABLE IF NOT EXISTS system_settings (key VARCHAR(50) PRIMARY KEY, value JSONB, updated_at TIMESTAMP DEFAULT NOW())' },
            { name: 'user_sessions', query: 'CREATE TABLE IF NOT EXISTS user_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, session_id VARCHAR(255) NOT NULL UNIQUE, login_at TIMESTAMP DEFAULT NOW(), last_activity_at TIMESTAMP DEFAULT NOW(), logout_at TIMESTAMP, presence_state VARCHAR(20) DEFAULT \'LIVE\' CHECK (presence_state IN (\'LIVE\', \'AWAY\', \'OFFLINE\')), ip_address VARCHAR(45), user_agent TEXT, created_at TIMESTAMP DEFAULT NOW())' },
            { name: 'app_clicks', query: 'CREATE TABLE IF NOT EXISTS app_clicks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, app_id UUID NOT NULL, clicked_at TIMESTAMP DEFAULT NOW(), source_page VARCHAR(100))' },
            { name: 'pin_attempts', query: 'CREATE TABLE IF NOT EXISTS pin_attempts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, app_tile_id UUID REFERENCES application_tiles(id) ON DELETE CASCADE, attempted_at TIMESTAMP DEFAULT NOW(), success BOOLEAN DEFAULT false)' }
        ];

        for (const step of steps) {
            console.log(`Working on: ${step.name}`);
            try {
                await client.query(step.query);
                console.log(`  Success: ${step.name}`);
            } catch (e) {
                console.error(`  Error in ${step.name}:`, e.message);
                // Continue to see more errors if any
            }
        }
    } finally {
        client.release();
        await pool.end();
    }
};
debug().catch(console.error);
