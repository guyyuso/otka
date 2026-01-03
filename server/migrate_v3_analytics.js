// Migration for User Activity Analytics
// Run with: node server/migrate_v3_analytics.js

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('Creating user_sessions table...');
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

        console.log('Creating app_clicks table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS app_clicks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                app_id UUID NOT NULL,
                clicked_at TIMESTAMP DEFAULT NOW(),
                source_page VARCHAR(100)
            )
        `);

        console.log('Creating indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_presence ON user_sessions(presence_state);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at);
            CREATE INDEX IF NOT EXISTS idx_app_clicks_user_id ON app_clicks(user_id);
            CREATE INDEX IF NOT EXISTS idx_app_clicks_app_id ON app_clicks(app_id);
            CREATE INDEX IF NOT EXISTS idx_app_clicks_clicked_at ON app_clicks(clicked_at);
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
