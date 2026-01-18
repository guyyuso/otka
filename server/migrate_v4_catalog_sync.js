// migrate_v4_catalog_sync.js
// Migration for Catalog Sync and Missing App Requests
// Run with: node server/migrate_v4_catalog_sync.js

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

const migrate = async () => {
    const client = await pool.connect();
    console.log('Starting Catalog Sync migration...');

    try {
        await client.query('BEGIN');

        // 1. Add columns to application_tiles for catalog sync
        console.log('Step 1: Enhancing application_tiles for catalog sync...');
        await client.query(`
            ALTER TABLE application_tiles
            ADD COLUMN IF NOT EXISTS app_identifier VARCHAR(255) UNIQUE,
            ADD COLUMN IF NOT EXISTS version VARCHAR(50),
            ADD COLUMN IF NOT EXISTS master_catalog_synced_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'pending'
        `);
        console.log('  -> Columns added to application_tiles.');

        // 2. Create catalog_sync_logs table
        console.log('Step 2: Creating catalog_sync_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS catalog_sync_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sync_id VARCHAR(255) UNIQUE NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                status VARCHAR(50) NOT NULL,
                apps_added INTEGER DEFAULT 0,
                apps_updated INTEGER DEFAULT 0,
                apps_marked_unavailable INTEGER DEFAULT 0,
                errors JSONB,
                triggered_by UUID REFERENCES users(id),
                sync_mode VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('  -> catalog_sync_logs table created.');

        // 3. Extend app_requests to support missing apps
        console.log('Step 3: Extending app_requests table...');
        await client.query(`
            ALTER TABLE app_requests
            ADD COLUMN IF NOT EXISTS app_identifier_or_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS app_exists_in_store BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100),
            ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
            ADD COLUMN IF NOT EXISTS desired_by_date DATE,
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'submitted'
        `);

        // Update existing status values to match new schema
        await client.query(`
            UPDATE app_requests 
            SET status = 'submitted' 
            WHERE status = 'PENDING' AND status != 'submitted'
        `);

        // Remove the old unique constraint if it exists
        await client.query(`
            ALTER TABLE app_requests
            DROP CONSTRAINT IF EXISTS app_requests_user_id_app_id_status_key
        `);

        // Create partial unique indexes instead of constraints with WHERE clauses
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS app_requests_user_app_unique 
            ON app_requests(user_id, app_id) 
            WHERE app_id IS NOT NULL
        `);

        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS app_requests_user_identifier_unique 
            ON app_requests(user_id, app_identifier_or_name) 
            WHERE app_identifier_or_name IS NOT NULL AND app_id IS NULL
        `);

        console.log('  -> app_requests table extended.');

        // 4. Create system_settings table for sync configuration
        console.log('Step 4: Creating system_settings table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                key VARCHAR(255) UNIQUE NOT NULL,
                value JSONB NOT NULL,
                description TEXT,
                updated_by UUID REFERENCES users(id),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Seed default sync settings
        await client.query(`
            INSERT INTO system_settings (key, value, description)
            VALUES 
                ('catalog_sync_frequency_hours', '6', 'Catalog sync frequency in hours'),
                ('catalog_sync_enabled', 'true', 'Enable/disable scheduled catalog sync'),
                ('catalog_sync_last_run', 'null', 'Last catalog sync timestamp')
            ON CONFLICT (key) DO NOTHING
        `);
        console.log('  -> system_settings table created and seeded.');

        // 5. Add new permissions
        console.log('Step 5: Adding new permissions...');
        const newPermissions = [
            { slug: 'catalog.sync', description: 'Trigger catalog sync' },
            { slug: 'requests.view_own', description: 'View own app requests' },
            { slug: 'requests.create', description: 'Create app requests for missing apps' }
        ];

        for (const perm of newPermissions) {
            await client.query(`
                INSERT INTO permissions (slug, description)
                VALUES ($1, $2)
                ON CONFLICT (slug) DO NOTHING
            `, [perm.slug, perm.description]);
        }
        console.log('  -> New permissions added.');

        // 6. Assign permissions to roles
        console.log('Step 6: Assigning permissions to roles...');
        const rolePermissions = [
            { roles: ['super_admin', 'admin'], slug: 'catalog.sync' },
            { roles: ['super_admin', 'admin', 'user'], slug: 'requests.view_own' },
            { roles: ['super_admin', 'admin', 'user'], slug: 'requests.create' }
        ];

        for (const rp of rolePermissions) {
            for (const roleName of rp.roles) {
                await client.query(`
                    INSERT INTO role_permissions (role_id, permission_id)
                    SELECT r.id, p.id FROM roles r, permissions p
                    WHERE r.name = $1 AND p.slug = $2
                    ON CONFLICT DO NOTHING
                `, [roleName, rp.slug]);
            }
        }
        console.log('  -> Permissions assigned to roles.');

        await client.query('COMMIT');
        console.log('\n✅ Catalog Sync migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

migrate().catch(console.error);

