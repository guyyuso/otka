import { initDatabase, pool } from './db.js';

async function run() {
    try {
        console.log('Running database initialization...');
        await initDatabase();
        console.log('Database initialized.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

run();
