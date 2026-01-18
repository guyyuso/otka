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

const debugSeeding = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Seeding Debug...');

        // 1. Check Roles
        console.log('Checking roles insertion...');
        await client.query(`INSERT INTO roles (name, description) VALUES ('super_admin', 'Full system access') ON CONFLICT (name) DO NOTHING`);
        console.log('  Success');

        // 2. Check Permissions
        console.log('Checking permissions insertion...');
        await client.query(`INSERT INTO permissions (slug, description) VALUES ('users.view', 'View user list') ON CONFLICT (slug) DO NOTHING`);
        console.log('  Success');

        // 3. Check Role-Permission Mapping (Isolating the SELECT)
        console.log('Checking role_permissions mapping query...');
        try {
            const res = await client.query(`
                SELECT r.id, p.id FROM roles r, permissions p
                WHERE r.name = 'super_admin' AND p.slug = 'users.view'
            `);
            console.log('  SELECT Success, found:', res.rowCount);
        } catch (e) {
            console.error('  SELECT Error:', e.message);
        }

        // 4. Check actual INSERT into role_permissions
        console.log('Checking role_permissions insertion...');
        try {
            await client.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id FROM roles r, permissions p
                WHERE r.name = 'super_admin' AND p.slug = 'users.view'
                ON CONFLICT DO NOTHING
            `);
            console.log('  INSERT Success');
        } catch (e) {
            console.error('  INSERT Error:', e.message);
        }

    } catch (err) {
        console.error('Fatal Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
};
debugSeeding().catch(console.error);
