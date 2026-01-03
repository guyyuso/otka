// routes/store.js
// User-facing Store API
import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/store
 * Get all apps available in the store for the current user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get apps that are available in store
        const appsResult = await pool.query(`
            SELECT 
                at.id, at.name, at.short_description, at.description, at.category,
                at.tags, at.publisher, at.logo_url, at.icon_url, at.launch_url,
                at.auth_type, at.requires_approval, at.status,
                CASE 
                    WHEN ua.id IS NOT NULL THEN 'ASSIGNED'
                    WHEN ar.status = 'PENDING' THEN 'PENDING'
                    WHEN ar.status = 'APPROVED' THEN 'APPROVED'
                    WHEN ar.status = 'DENIED' THEN 'DENIED'
                    ELSE 'AVAILABLE'
                END as user_status
            FROM application_tiles at
            LEFT JOIN user_app_assignments ua ON at.id = ua.app_tile_id AND ua.user_id = $1
            LEFT JOIN app_requests ar ON at.id = ar.app_id AND ar.user_id = $1
            WHERE at.is_available_in_store = true AND at.status = 'active'
            ORDER BY at.name ASC
        `, [userId]);

        res.json(appsResult.rows);
    } catch (error) {
        logger.error('Error fetching store apps', error);
        res.status(500).json({ error: 'Failed to fetch store apps' });
    }
});

/**
 * GET /api/store/:id
 * Get details for a single app
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT 
                at.*,
                CASE 
                    WHEN ua.id IS NOT NULL THEN 'ASSIGNED'
                    WHEN ar.status = 'PENDING' THEN 'PENDING'
                    WHEN ar.status = 'APPROVED' THEN 'APPROVED'
                    WHEN ar.status = 'DENIED' THEN 'DENIED'
                    ELSE 'AVAILABLE'
                END as user_status,
                ar.deny_reason as last_deny_reason
            FROM application_tiles at
            LEFT JOIN user_app_assignments ua ON at.id = ua.app_tile_id AND ua.user_id = $2
            LEFT JOIN app_requests ar ON at.id = ar.app_id AND ar.user_id = $2
            WHERE at.id = $1
        `, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'App not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching app details', error);
        res.status(500).json({ error: 'Failed to fetch app details' });
    }
});

/**
 * POST /api/store/:id/request
 * Request access to an app
 */
router.post('/:id/request', async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Reason is required' });
    }

    try {
        // Check if app exists and is in store
        const appCheck = await pool.query(
            'SELECT id, name, requires_approval FROM application_tiles WHERE id = $1 AND is_available_in_store = true',
            [id]
        );

        if (appCheck.rows.length === 0) {
            return res.status(404).json({ error: 'App not found in store' });
        }

        const app = appCheck.rows[0];

        // Check if user already has this app or a pending request
        const existingCheck = await pool.query(`
            SELECT 
                (SELECT id FROM user_app_assignments WHERE user_id = $1 AND app_tile_id = $2) as assignment_id,
                (SELECT id FROM app_requests WHERE user_id = $1 AND app_id = $2 AND status = 'PENDING') as pending_request_id
        `, [userId, id]);

        if (existingCheck.rows[0].assignment_id) {
            return res.status(400).json({ error: 'You already have access to this app' });
        }

        if (existingCheck.rows[0].pending_request_id) {
            return res.status(400).json({ error: 'You already have a pending request for this app' });
        }

        // If app doesn't require approval, auto-approve
        if (!app.requires_approval) {
            // Directly assign the app
            await pool.query(`
                INSERT INTO user_app_assignments (user_id, app_tile_id, assigned_by)
                VALUES ($1, $2, $1)
            `, [userId, id]);

            // Log to audit
            await pool.query(`
                INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address)
                VALUES ($1, 'app.self_assigned', $2, $3, $4)
            `, [userId, id, JSON.stringify({ app_name: app.name }), req.ip]);

            return res.json({
                message: 'App has been added to your dashboard',
                status: 'ASSIGNED',
                auto_approved: true
            });
        }

        // Create request
        const requestResult = await pool.query(`
            INSERT INTO app_requests (user_id, app_id, reason, status)
            VALUES ($1, $2, $3, 'PENDING')
            RETURNING id, created_at
        `, [userId, id, reason.trim()]);

        const request = requestResult.rows[0];

        // Add to history
        await pool.query(`
            INSERT INTO app_request_history (request_id, status, changed_by, note)
            VALUES ($1, 'PENDING', $2, 'Request submitted')
        `, [request.id, userId]);

        // Audit log
        await pool.query(`
            INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address)
            VALUES ($1, 'app.requested', $2, $3, $4)
        `, [userId, id, JSON.stringify({ app_name: app.name, reason: reason.trim() }), req.ip]);

        res.status(201).json({
            message: 'Request submitted successfully',
            status: 'PENDING',
            request_id: request.id
        });

    } catch (error) {
        logger.error('Error creating app request', error);
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

/**
 * GET /api/store/my-requests
 * Get user's own requests
 */
router.get('/my/requests', async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT 
                ar.id, ar.reason, ar.status, ar.admin_note, ar.deny_reason,
                ar.created_at, ar.reviewed_at,
                at.id as app_id, at.name as app_name, at.logo_url, at.icon_url
            FROM app_requests ar
            JOIN application_tiles at ON ar.app_id = at.id
            WHERE ar.user_id = $1
            ORDER BY ar.created_at DESC
        `, [userId]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching user requests', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

export default router;
