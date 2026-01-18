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
        console.log('Debugging Role-Permission Assignment...');

        const rolePermissionsMap = {
            'super_admin': ['users.view', 'users.create'],
            'admin': ['users.view', 'users.create'],
            'user': ['apps.view']
        };

        for (const [roleName, slugs] of Object.entries(rolePermissionsMap)) {
            console.log(`Processing role: ${roleName}`);
            for (const slug of slugs) {
                console.log(`  Assigning slug: ${slug}`);
                try {
                    const res = await client.query(`
                        INSERT INTO role_permissions (role_id, permission_id)
                        SELECT r.id, p.id FROM roles r, permissions p
                        WHERE r.name = $1 AND p.slug = $2
                        ON CONFLICT DO NOTHING
                        RETURNING *
                    `, [roleName, slug]);
                    console.log(`    Result: ${res.rowCount} row(s) updated/inserted.`);
                } catch (e) {
                    console.error(`    Error:`, e.message);
                }
            }
        }
    } finally {
        client.release();
        await pool.end();
    }
};
debug().catch(console.error);
