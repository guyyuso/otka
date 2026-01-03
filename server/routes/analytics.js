// Analytics API Routes - User Activity & Application Usage
import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/admin/analytics/user-activity/live
 * Get live users with session info and presence
 */
router.get('/user-activity/live', requirePermission('users.view'), async (req, res) => {
    try {
        // Get all active sessions (logged in within last 30 mins = LIVE, 30-60 mins = AWAY)
        const result = await pool.query(`
            SELECT 
                u.id as user_id,
                u.email,
                u.full_name,
                u.role,
                s.id as session_id,
                s.created_at as session_start,
                s.created_at as login_at,
                EXTRACT(EPOCH FROM (NOW() - s.created_at)) as session_duration_seconds,
                CASE 
                    WHEN s.created_at > NOW() - INTERVAL '30 minutes' THEN 'LIVE'
                    WHEN s.created_at > NOW() - INTERVAL '60 minutes' THEN 'AWAY'
                    ELSE 'OFFLINE'
                END as presence_state,
                s.created_at as last_activity_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.expires_at > NOW()
            ORDER BY s.created_at DESC
        `);

        // Group by user (one user may have multiple sessions)
        const userMap = new Map();
        for (const row of result.rows) {
            if (!userMap.has(row.user_id)) {
                userMap.set(row.user_id, {
                    userId: row.user_id,
                    email: row.email,
                    fullName: row.full_name,
                    role: row.role,
                    sessionId: row.session_id,
                    loginAt: row.login_at,
                    sessionDurationSeconds: Math.round(row.session_duration_seconds),
                    presenceState: row.presence_state,
                    lastActivityAt: row.last_activity_at
                });
            }
        }

        const liveUsers = Array.from(userMap.values());

        res.json({
            liveUsers,
            counts: {
                LIVE: liveUsers.filter(u => u.presenceState === 'LIVE').length,
                AWAY: liveUsers.filter(u => u.presenceState === 'AWAY').length,
                total: liveUsers.length
            }
        });
    } catch (error) {
        console.error('Error fetching live user activity:', error);
        res.status(500).json({ error: 'Failed to fetch user activity' });
    }
});

/**
 * GET /api/admin/analytics/application-usage
 * Get application usage stats per user
 */
router.get('/application-usage', requirePermission('users.view'), async (req, res) => {
    try {
        // Get user uptime and last app accessed from audit logs
        const result = await pool.query(`
            SELECT 
                u.id as user_id,
                u.email,
                u.full_name,
                u.role,
                s.created_at as session_start,
                EXTRACT(EPOCH FROM (NOW() - s.created_at)) as uptime_seconds,
                CASE 
                    WHEN s.created_at > NOW() - INTERVAL '30 minutes' THEN 'LIVE'
                    WHEN s.created_at > NOW() - INTERVAL '60 minutes' THEN 'AWAY'
                    ELSE 'OFFLINE'
                END as presence_state,
                al.details->>'appName' as last_app_name,
                al.created_at as last_app_opened_at
            FROM users u
            LEFT JOIN sessions s ON s.user_id = u.id AND s.expires_at > NOW()
            LEFT JOIN LATERAL (
                SELECT * FROM audit_logs 
                WHERE actor_id = u.id 
                AND action IN ('app.access', 'app.launch')
                ORDER BY created_at DESC 
                LIMIT 1
            ) al ON true
            ORDER BY s.created_at DESC NULLS LAST
        `);

        const usersUsage = result.rows.map(row => ({
            userId: row.user_id,
            email: row.email,
            fullName: row.full_name,
            role: row.role,
            uptimeSeconds: row.uptime_seconds ? Math.round(row.uptime_seconds) : 0,
            presenceState: row.session_start ? row.presence_state : 'OFFLINE',
            lastAppName: row.last_app_name || null,
            lastAppOpenedAt: row.last_app_opened_at || null,
            isLive: row.session_start && row.presence_state === 'LIVE'
        }));

        res.json({ users: usersUsage });
    } catch (error) {
        console.error('Error fetching application usage:', error);
        res.status(500).json({ error: 'Failed to fetch application usage' });
    }
});

export default router;
