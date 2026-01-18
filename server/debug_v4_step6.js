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
        console.log('Debugging Step 6: Assigning permissions to roles...');
        const rolePermissions = [
            { roles: ['super_admin', 'admin'], slug: 'catalog.sync' },
            { roles: ['super_admin', 'admin', 'user'], slug: 'requests.view_own' },
            { roles: ['super_admin', 'admin', 'user'], slug: 'requests.create' }
        ];

        for (const rp of rolePermissions) {
            console.log(`Processing slug: ${rp.slug}`);
            for (const roleName of rp.roles) {
                console.log(`  Assigning to role: ${roleName}`);
                try {
                    const res = await client.query(`
                        INSERT INTO role_permissions (role_id, permission_id)
                        SELECT r.id, p.id FROM roles r, permissions p
                        WHERE r.name = $1 AND p.slug = $2
                        ON CONFLICT DO NOTHING
                        RETURNING *
                    `, [roleName, rp.slug]);
                    console.log(`    Result: ${res.rowCount} row(s) updated/inserted.`);
                    if (res.rowCount === 0) {
                        // Check if role and permission actually exist
                        const role = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
                        const perm = await client.query('SELECT id FROM permissions WHERE slug = $1', [rp.slug]);
                        console.log(`    Validation: Role ${roleName} exists: ${role.rowCount > 0}, Perm ${rp.slug} exists: ${perm.rowCount > 0}`);
                    }
                } catch (e) {
                    console.error(`    Error in sub-step:`, e);
                }
            }
        }
    } finally {
        client.release();
        await pool.end();
    }
};
debug().catch(console.error);
