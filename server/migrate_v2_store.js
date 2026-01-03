// migrate_v2_store.js
// One-off migration script for App Store features.
// Adds new columns to application_tiles and creates app_requests table.
// Run with: node migrate_v2_store.js

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
    console.log('Starting App Store migration...');

    try {
        await client.query('BEGIN');

        // 1. Enhance application_tiles table
        console.log('Step 1: Enhancing application_tiles table...');

        // Add short_description (rename existing description to full_description conceptually, but keep as is for compatibility)
        await client.query(`
            ALTER TABLE application_tiles
            ADD COLUMN IF NOT EXISTS short_description VARCHAR(255),
            ADD COLUMN IF NOT EXISTS tags TEXT[],
            ADD COLUMN IF NOT EXISTS publisher VARCHAR(255),
            ADD COLUMN IF NOT EXISTS is_available_in_store BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
            ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS icon_url TEXT
        `);
        console.log('  -> Columns added to application_tiles.');

        // 2. Create app_requests table
        console.log('Step 2: Creating app_requests table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                app_id UUID NOT NULL REFERENCES application_tiles(id) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                reviewed_by UUID REFERENCES users(id),
                reviewed_at TIMESTAMP,
                admin_note TEXT,
                deny_reason TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, app_id, status)
            )
        `);
        console.log('  -> app_requests table created.');

        // 3. Create app_request_history table for tracking changes
        console.log('Step 3: Creating app_request_history table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_request_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                request_id UUID NOT NULL REFERENCES app_requests(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                changed_by UUID REFERENCES users(id),
                note TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('  -> app_request_history table created.');

        // 4. Seed new permissions
        console.log('Step 4: Seeding new permissions...');
        const newPermissions = [
            { slug: 'apps.publish', description: 'Publish/unpublish apps to the Store' },
            { slug: 'app_requests.read', description: 'View app request queue' },
            { slug: 'app_requests.approve', description: 'Approve app requests' },
            { slug: 'app_requests.deny', description: 'Deny app requests' }
        ];

        for (const perm of newPermissions) {
            await client.query(`
                INSERT INTO permissions (slug, description)
                VALUES ($1, $2)
                ON CONFLICT (slug) DO NOTHING
            `, [perm.slug, perm.description]);
        }
        console.log('  -> New permissions seeded.');

        // 5. Assign new permissions to super_admin
        console.log('Step 5: Assigning new permissions to super_admin...');
        await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE r.name = 'super_admin' AND p.slug IN ('apps.publish', 'app_requests.read', 'app_requests.approve', 'app_requests.deny')
            ON CONFLICT DO NOTHING
        `);
        console.log('  -> Permissions assigned to super_admin.');

        // 6. Assign request permissions to admin
        console.log('Step 6: Assigning request permissions to admin...');
        await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r, permissions p
            WHERE r.name = 'admin' AND p.slug IN ('app_requests.read', 'app_requests.approve', 'app_requests.deny')
            ON CONFLICT DO NOTHING
        `);
        console.log('  -> Permissions assigned to admin.');

        await client.query('COMMIT');
        console.log('\n✅ App Store migration completed successfully!');

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
