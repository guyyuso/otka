import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function verifyTables() {
    try {
        const client = await pool.connect();
        try {
            console.log('Verifying Roles...');
            const roles = await client.query('SELECT * FROM roles');
            console.log('Roles found:', roles.rows.length);
            roles.rows.forEach(r => console.log(` - ${r.name}`));

            console.log('\nVerifying Permissions...');
            const perms = await client.query('SELECT * FROM permissions');
            console.log('Permissions found:', perms.rows.length);

            console.log('\nVerifying Application Tiles table...');
            const apps = await client.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'application_tiles\')');
            console.log('application_tiles exists:', apps.rows[0].exists);

            console.log('\nVerifying Users username column...');
            const userCol = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='username'");
            console.log('username column exists:', userCol.rows.length > 0);

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await pool.end();
    }
}

verifyTables();
