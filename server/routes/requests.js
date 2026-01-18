// routes/requests.js
// User-facing App Requests API (for missing apps)
import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logger } from '../logger.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/requests
 * Submit a request for a missing app
 * Permission: requests.create
 */
router.post('/', requirePermission('requests.create'), async (req, res) => {
    const userId = req.user.id;
    const {
        app_identifier_or_name,
        business_justification,
        cost_center,
        priority,
        desired_by_date,
        notes
    } = req.body;

    if (!app_identifier_or_name || !business_justification) {
        return res.status(400).json({ 
            error: 'App identifier/name and business justification are required' 
        });
    }

    try {
        // Check if app already exists in store
        const existingApp = await pool.query(`
            SELECT id FROM application_tiles
            WHERE (name ILIKE $1 OR app_identifier = $1)
            AND is_available_in_store = true
            AND status = 'active'
            LIMIT 1
        `, [app_identifier_or_name]);

        if (existingApp.rows.length > 0) {
            return res.status(400).json({ 
                error: 'This app already exists in the store',
                app_id: existingApp.rows[0].id
            });
        }

        // Check for duplicate open request
        const duplicateRequest = await pool.query(`
            SELECT id, status FROM app_requests
            WHERE user_id = $1
            AND app_identifier_or_name = $2
            AND app_id IS NULL
            AND status IN ('submitted', 'in_review')
        `, [userId, app_identifier_or_name]);

        if (duplicateRequest.rows.length > 0) {
            return res.status(400).json({
                error: 'You already have an open request for this app',
                request_id: duplicateRequest.rows[0].id,
                status: duplicateRequest.rows[0].status
            });
        }

        // Create request
        const result = await pool.query(`
            INSERT INTO app_requests (
                user_id,
                app_identifier_or_name,
                app_exists_in_store,
                reason,
                status,
                cost_center,
                priority,
                desired_by_date,
                notes
            )
            VALUES ($1, $2, false, $3, 'submitted', $4, $5, $6, $7)
            RETURNING *
        `, [
            userId,
            app_identifier_or_name,
            business_justification,
            cost_center || null,
            priority || null,
            desired_by_date || null,
            notes || null
        ]);

        const request = result.rows[0];

        // Add to history
        await pool.query(`
            INSERT INTO app_request_history (request_id, status, changed_by, note)
            VALUES ($1, 'submitted', $2, 'Request submitted')
        `, [request.id, userId]);

        // Audit log
        await pool.query(`
            INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address)
            VALUES ($1, 'request.created', $2, $3, $4)
        `, [
            userId,
            request.id,
            JSON.stringify({
                app_identifier_or_name,
                app_exists_in_store: false
            }),
            req.ip
        ]);

        res.status(201).json({
            message: 'Request submitted successfully',
            request: request
        });

    } catch (error) {
        logger.error('Error creating request', error);
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

/**
 * GET /api/requests
 * Get user's own requests (or all requests if admin)
 * Permission: requests.view_own (or admin permissions)
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { status, limit = 50, offset = 0 } = req.query;

        let query = '';
        let params = [];

        if (userRole === 'admin' || userRole === 'super_admin') {
            // Admin sees all requests
            query = `
                SELECT 
                    ar.*,
                    u.email as requester_email,
                    u.full_name as requester_name,
                    at.id as app_id,
                    at.name as app_name,
                    at.logo_url,
                    at.icon_url,
                    reviewer.full_name as reviewed_by_name
                FROM app_requests ar
                JOIN users u ON ar.user_id = u.id
                LEFT JOIN application_tiles at ON ar.app_id = at.id
                LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
            `;

            if (status) {
                query += ` WHERE ar.status = $1`;
                params.push(status);
                query += ` ORDER BY ar.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
                params.push(parseInt(limit), parseInt(offset));
            } else {
                query += ` ORDER BY ar.created_at DESC LIMIT $1 OFFSET $2`;
                params.push(parseInt(limit), parseInt(offset));
            }
        } else {
            // User sees only own requests
            query = `
                SELECT 
                    ar.*,
                    at.id as app_id,
                    at.name as app_name,
                    at.logo_url,
                    at.icon_url,
                    reviewer.full_name as reviewed_by_name
                FROM app_requests ar
                LEFT JOIN application_tiles at ON ar.app_id = at.id
                LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
                WHERE ar.user_id = $1
            `;
            params.push(userId);

            if (status) {
                query += ` AND ar.status = $2`;
                params.push(status);
                query += ` ORDER BY ar.created_at DESC LIMIT $3 OFFSET $4`;
                params.push(parseInt(limit), parseInt(offset));
            } else {
                query += ` ORDER BY ar.created_at DESC LIMIT $2 OFFSET $3`;
                params.push(parseInt(limit), parseInt(offset));
            }
        }

        const result = await pool.query(query, params);

        // Normalize status values (handle old 'PENDING' status)
        const normalizedRows = result.rows.map(row => {
            if (row.status === 'PENDING') {
                row.status = 'submitted';
            }
            return row;
        });

        res.json(normalizedRows);
    } catch (error) {
        logger.error('Error fetching requests', error);
        res.status(500).json({ error: 'Failed to fetch requests', details: error.message });
    }
});

/**
 * GET /api/requests/:id
 * Get request details with history
 * Permission: requests.view_own (or admin)
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get request
        const requestResult = await pool.query(`
            SELECT 
                ar.*,
                u.email as requester_email,
                u.full_name as requester_name,
                at.id as app_id,
                at.name as app_name,
                at.logo_url,
                at.description,
                reviewer.full_name as reviewed_by_name
            FROM app_requests ar
            JOIN users u ON ar.user_id = u.id
            LEFT JOIN application_tiles at ON ar.app_id = at.id
            LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
            WHERE ar.id = $1
        `, [id]);

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestResult.rows[0];

        // Check permissions
        if (userRole !== 'admin' && userRole !== 'super_admin' && request.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get history
        const historyResult = await pool.query(`
            SELECT arh.*, u.full_name as changed_by_name
            FROM app_request_history arh
            LEFT JOIN users u ON arh.changed_by = u.id
            WHERE arh.request_id = $1
            ORDER BY arh.created_at ASC
        `, [id]);

        res.json({
            ...request,
            history: historyResult.rows
        });
    } catch (error) {
        logger.error('Error fetching request details', error);
        res.status(500).json({ error: 'Failed to fetch request' });
    }
});

/**
 * DELETE /api/requests/:id
 * Cancel own request (if not approved)
 * Permission: requests.view_own
 */
router.delete('/:id', requirePermission('requests.view_own'), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Get request
        const requestResult = await pool.query(
            'SELECT * FROM app_requests WHERE id = $1',
            [id]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestResult.rows[0];

        // Check ownership
        if (request.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if can be cancelled
        if (request.status === 'approved' || request.status === 'implemented') {
            return res.status(400).json({ 
                error: 'Cannot cancel an approved or implemented request' 
            });
        }

        // Update status
        await pool.query(`
            UPDATE app_requests
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = $1
        `, [id]);

        // Add to history
        await pool.query(`
            INSERT INTO app_request_history (request_id, status, changed_by, note)
            VALUES ($1, 'cancelled', $2, 'Request cancelled by user')
        `, [id, userId]);

        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        logger.error('Error cancelling request', error);
        res.status(500).json({ error: 'Failed to cancel request' });
    }
});

export default router;

