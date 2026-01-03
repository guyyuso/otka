// PIN verification routes
import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * POST /api/dashboard/apps/:appTileId/verify-pin
 * Verify user's PIN before launching an assigned app
 * Rate limited: 5 attempts per 5 minutes
 */
router.post('/apps/:appTileId/verify-pin', async (req, res) => {
    const { appTileId } = req.params;
    const { pin4 } = req.body;
    const userId = req.user.userId;

    if (!pin4 || !/^\d{4}$/.test(pin4)) {
        return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    try {
        // Check rate limiting - 5 attempts in last 5 minutes
        const recentAttempts = await pool.query(
            `SELECT COUNT(*) as count FROM pin_attempts 
             WHERE user_id = $1 AND app_tile_id = $2 
             AND attempted_at > NOW() - INTERVAL '5 minutes'
             AND success = false`,
            [userId, appTileId]
        );

        const failedCount = parseInt(recentAttempts.rows[0].count);
        if (failedCount >= 5) {
            // Log lockout
            await pool.query(
                `INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address)
                 VALUES ($1, 'USER_APP_PIN_LOCKED', $2, $3, $4)`,
                [userId, appTileId, JSON.stringify({ reason: 'Too many failed attempts' }), req.ip]
            );

            return res.status(429).json({
                error: 'Too many failed attempts. Please try again in 5 minutes.',
                verified: false,
                lockedUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            });
        }

        // Get assignment and PIN hash
        const assignment = await pool.query(
            `SELECT id, pin_hash, requires_pin, app_tile_id 
             FROM user_app_assignments 
             WHERE user_id = $1 AND app_tile_id = $2`,
            [userId, appTileId]
        );

        if (assignment.rows.length === 0) {
            return res.status(404).json({ error: 'App not assigned to user', verified: false });
        }

        const { pin_hash, requires_pin } = assignment.rows[0];

        if (!requires_pin) {
            return res.json({ verified: true, message: 'PIN not required for this app' });
        }

        if (!pin_hash) {
            return res.status(400).json({ error: 'No PIN set for this app', verified: false });
        }

        // Verify PIN
        const isValid = await bcrypt.compare(pin4, pin_hash);

        // Log attempt
        await pool.query(
            `INSERT INTO pin_attempts (user_id, app_tile_id, success)
             VALUES ($1, $2, $3)`,
            [userId, appTileId, isValid]
        );

        // Audit log
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                isValid ? 'USER_APP_PIN_VERIFIED_SUCCESS' : 'USER_APP_PIN_VERIFIED_FAIL',
                appTileId,
                JSON.stringify({ appTileId }),
                req.ip
            ]
        );

        if (!isValid) {
            const remainingAttempts = 5 - failedCount - 1;
            return res.status(401).json({
                error: 'Incorrect PIN',
                verified: false,
                remainingAttempts
            });
        }

        res.json({ verified: true });

    } catch (error) {
        logger.error('PIN verification error:', error);
        res.status(500).json({ error: 'Verification failed', verified: false });
    }
});

/**
 * GET /api/dashboard/apps/:appTileId/pin-status
 * Check if app requires PIN and if user has PIN set
 */
router.get('/apps/:appTileId/pin-status', async (req, res) => {
    const { appTileId } = req.params;
    const userId = req.user.userId;

    try {
        const assignment = await pool.query(
            `SELECT requires_pin, pin_hash IS NOT NULL as has_pin 
             FROM user_app_assignments 
             WHERE user_id = $1 AND app_tile_id = $2`,
            [userId, appTileId]
        );

        if (assignment.rows.length === 0) {
            return res.status(404).json({ error: 'App not assigned' });
        }

        const { requires_pin, has_pin } = assignment.rows[0];
        res.json({ requiresPin: requires_pin, hasPin: has_pin });

    } catch (error) {
        logger.error('PIN status check error:', error);
        res.status(500).json({ error: 'Failed to check PIN status' });
    }
});

export default router;
