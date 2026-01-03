import express from 'express';
import { pool } from '../db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get admin stats
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
        const activeUsersResult = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'active'");
        const totalAppsResult = await pool.query('SELECT COUNT(*) FROM applications');
        const loginAttemptsResult = await pool.query("SELECT value FROM system_settings WHERE key = 'security'");

        let loginAttempts = 0;
        if (loginAttemptsResult.rows.length > 0) {
            // This is just a mock for now, ideally we'd track actual attempts
            loginAttempts = Math.floor(Math.random() * 100);
        }

        res.json({
            totalUsers: parseInt(totalUsersResult.rows[0].count) || 0,
            activeUsers: parseInt(activeUsersResult.rows[0].count) || 0,
            totalApps: parseInt(totalAppsResult.rows[0].count) || 0,
            loginAttempts: loginAttempts
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

import fs from 'fs';
import path from 'path';
import { superAdminMiddleware } from '../middleware/auth.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, '../logs/app.log');

// Get system logs (Super Admin Only)
router.get('/logs', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        if (!fs.existsSync(logFilePath)) {
            return res.json({ logs: [] });
        }

        const logs = fs.readFileSync(logFilePath, 'utf8')
            .split('\n')
            .filter(line => line.trim() !== '')
            .slice(-100) // Last 100 lines
            .reverse(); // Newest first

        res.json({ logs });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Get system settings (Super Admin Only)
router.get('/settings', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM system_settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update system settings (Super Admin Only)
router.put('/settings/:key', authMiddleware, superAdminMiddleware, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        await pool.query(
            `INSERT INTO system_settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
            [key, value]
        );

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
