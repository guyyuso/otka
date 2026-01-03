import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { logger } from '../logger.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/admin/assignments/users/:userId
 * List assigned apps for a user
 * Permission: apps.view (or users.view)
 */
router.get('/users/:userId', requirePermission('apps.view'), async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT ua.id, ua.assigned_at, at.id as app_id, at.name, at.logo_url, at.launch_url, at.auth_type
            FROM user_app_assignments ua
            JOIN application_tiles at ON ua.app_tile_id = at.id
            WHERE ua.user_id = $1
            ORDER BY at.name ASC
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching user assignments', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

/**
 * POST /api/admin/assignments/users/:userId
 * Assign app to user with username and 4-digit PIN
 * Permission: apps.assign
 */
router.post('/users/:userId', requirePermission('apps.assign'), async (req, res) => {
    const { userId } = req.params;
    const { appTileId, credentials, appUsername, pin4, requiresPin = true } = req.body;

    if (!appTileId) {
        return res.status(400).json({ error: 'App Tile ID is required' });
    }

    // Validate PIN if provided
    if (pin4 && !/^\d{4}$/.test(pin4)) {
        return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    // Hash PIN
    let pinHash = null;
    if (pin4) {
        pinHash = await bcrypt.hash(pin4, 10);
    }

    // Encrypt credentials if provided (legacy support)
    let encryptedCreds = null;
    if (credentials) {
        encryptedCreds = encrypt(credentials);
    }

    try {
        const result = await pool.query(
            `INSERT INTO user_app_assignments 
            (user_id, app_tile_id, encrypted_credentials, app_username, pin_hash, requires_pin, assigned_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, assigned_at`,
            [userId, appTileId, encryptedCreds, appUsername || null, pinHash, requiresPin, req.user.id]
        );

        // Audit
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address) 
             VALUES ($1, 'USER_APP_PIN_SET', $2, $3, $4)`,
            [req.user.id, userId, JSON.stringify({ appTileId, appUsername, requiresPin }), req.ip]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'App already assigned to user' });
        }
        logger.error('Error assigning app', error);
        res.status(500).json({ error: 'Failed to assign app' });
    }
});

/**
 * DELETE /api/admin/assignments/users/:userId/apps/:appTileId
 * Unassign app
 * Permission: apps.assign
 */
router.delete('/users/:userId/apps/:appTileId', requirePermission('apps.assign'), async (req, res) => {
    const { userId, appTileId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM user_app_assignments WHERE user_id = $1 AND app_tile_id = $2 RETURNING id',
            [userId, appTileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Audit
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address) 
             VALUES ($1, 'apps.unassign', $2, $3, $4)`,
            [req.user.id, userId, JSON.stringify({ appTileId }), req.ip]
        );

        res.json({ message: 'App unassigned successfully' });
    } catch (error) {
        logger.error('Error unassigning app', error);
        res.status(500).json({ error: 'Failed to unassign app' });
    }
});

/**
 * GET /api/admin/assignments/apps/:appTileId/users
 * List users assigned to an app
 * Permission: apps.view
 */
router.get('/apps/:appTileId/users', requirePermission('apps.view'), async (req, res) => {
    const { appTileId } = req.params;
    try {
        const query = `
            SELECT u.id, u.email, u.name as full_name, u.role, ua.assigned_at, ua.assigned_by
            FROM user_app_assignments ua
            JOIN users u ON ua.user_id = u.id
            WHERE ua.app_tile_id = $1
            ORDER BY u.name ASC
        `;
        const result = await pool.query(query, [appTileId]);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching app assignments', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

/**
 * GET /api/admin/assignments/username-suggestions
 * Get username suggestions for autocomplete
 * Searches previously used app_usernames
 */
router.get('/username-suggestions', requirePermission('apps.assign'), async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 1) {
        return res.json({ suggestions: [] });
    }

    try {
        const result = await pool.query(
            `SELECT DISTINCT app_username as value, app_username as display, 'HISTORY' as source
             FROM user_app_assignments
             WHERE app_username IS NOT NULL 
             AND app_username ILIKE $1
             ORDER BY app_username
             LIMIT $2`,
            [`${q}%`, parseInt(limit)]
        );

        res.json({ suggestions: result.rows });
    } catch (error) {
        logger.error('Error fetching username suggestions', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

export default router;
