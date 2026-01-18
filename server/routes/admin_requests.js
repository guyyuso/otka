// routes/admin_requests.js
// Admin API for managing app requests
import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logger } from '../logger.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/admin/requests
 * Get all app requests (with optional filters)
 * Permission: app_requests.read
 */
router.get('/', requirePermission('app_requests.read'), async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                ar.id, ar.reason, ar.status, ar.admin_note, ar.deny_reason,
                ar.created_at, ar.reviewed_at, ar.updated_at,
                u.id as user_id, u.email as user_email, u.full_name as user_name,
                at.id as app_id, at.name as app_name, at.logo_url, at.icon_url, at.category,
                reviewer.full_name as reviewed_by_name
            FROM app_requests ar
            JOIN users u ON ar.user_id = u.id
            JOIN application_tiles at ON ar.app_id = at.id
            LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
        `;

        const params = [];
        if (status) {
            query += ` WHERE ar.status = $1`;
            params.push(status);
        }

        query += ` ORDER BY 
            CASE ar.status WHEN 'submitted' THEN 0 WHEN 'in_review' THEN 1 ELSE 2 END,
            ar.created_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get counts per status
        const countsResult = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM app_requests
            GROUP BY status
        `);

        const counts = {};
        countsResult.rows.forEach(row => {
            counts[row.status] = parseInt(row.count);
        });

        res.json({
            requests: result.rows,
            counts,
            pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        });

    } catch (error) {
        logger.error('Error fetching requests', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

/**
 * GET /api/admin/requests/:id
 * Get a single request with history
 * Permission: app_requests.read
 */
router.get('/:id', requirePermission('app_requests.read'), async (req, res) => {
    try {
        const { id } = req.params;

        const requestResult = await pool.query(`
            SELECT 
                ar.*,
                u.id as user_id, u.email as user_email, u.full_name as user_name,
                at.id as app_id, at.name as app_name, at.logo_url, at.description,
                reviewer.full_name as reviewed_by_name
            FROM app_requests ar
            JOIN users u ON ar.user_id = u.id
            JOIN application_tiles at ON ar.app_id = at.id
            LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
            WHERE ar.id = $1
        `, [id]);

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const historyResult = await pool.query(`
            SELECT arh.*, u.full_name as changed_by_name
            FROM app_request_history arh
            LEFT JOIN users u ON arh.changed_by = u.id
            WHERE arh.request_id = $1
            ORDER BY arh.created_at ASC
        `, [id]);

        res.json({
            ...requestResult.rows[0],
            history: historyResult.rows
        });

    } catch (error) {
        logger.error('Error fetching request details', error);
        res.status(500).json({ error: 'Failed to fetch request' });
    }
});

/**
 * POST /api/admin/requests/:id/approve
 * Approve a request
 * Permission: app_requests.approve
 */
router.post('/:id/approve', requirePermission('app_requests.approve'), async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = req.user.id;

    try {
        // Get request
        const requestResult = await pool.query(
            'SELECT * FROM app_requests WHERE id = $1',
            [id]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestResult.rows[0];

        if (request.status !== 'submitted' && request.status !== 'in_review') {
            return res.status(400).json({ error: 'Request is not in a reviewable state' });
        }

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update request status to approved first
            await client.query(`
                UPDATE app_requests
                SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), admin_note = $2, updated_at = NOW()
                WHERE id = $3
            `, [adminId, note || null, id]);

            // Add to history
            await client.query(`
                INSERT INTO app_request_history (request_id, status, changed_by, note)
                VALUES ($1, 'approved', $2, $3)
            `, [id, adminId, note || 'Request approved']);

            // If app doesn't exist in store (missing app request), add it first
            if (!request.app_exists_in_store && request.app_identifier_or_name) {
                // Check if app was added to catalog during sync
                const catalogApp = await client.query(`
                    SELECT id FROM application_tiles
                    WHERE (name ILIKE $1 OR app_identifier = $1)
                    AND is_available_in_store = true
                    LIMIT 1
                `, [request.app_identifier_or_name]);

                if (catalogApp.rows.length > 0) {
                    // Update request with app_id
                    await client.query(`
                        UPDATE app_requests
                        SET app_id = $1, app_exists_in_store = true
                        WHERE id = $2
                    `, [catalogApp.rows[0].id, id]);
                    request.app_id = catalogApp.rows[0].id;
                } else {
                    // Create app tile from request (simplified - in production would fetch from master catalog)
                    const newAppResult = await client.query(`
                        INSERT INTO application_tiles (
                            name, app_identifier, description, 
                            is_available_in_store, status, created_by
                        )
                        VALUES ($1, $2, $3, true, 'active', $4)
                        RETURNING id
                    `, [
                        request.app_identifier_or_name,
                        request.app_identifier_or_name.toLowerCase().replace(/\s+/g, '-'),
                        `Added via request from ${request.user_id}`,
                        adminId
                    ]);
                    
                    await client.query(`
                        UPDATE app_requests
                        SET app_id = $1, app_exists_in_store = true
                        WHERE id = $2
                    `, [newAppResult.rows[0].id, id]);
                    request.app_id = newAppResult.rows[0].id;
                }
            }

            // Assign the app to user if app_id exists
            if (request.app_id) {
                await client.query(`
                    INSERT INTO user_app_assignments (user_id, app_tile_id, assigned_by)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (user_id, app_tile_id) DO NOTHING
                `, [request.user_id, request.app_id, adminId]);
            }

            // Audit log
            await client.query(`
                INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address)
                VALUES ($1, 'request.approved', $2, $3, $4)
            `, [adminId, id, JSON.stringify({ user_id: request.user_id, app_id: request.app_id }), req.ip]);

            // Mark request as implemented if app is now in store
            if (request.app_id) {
                await client.query(`
                    UPDATE app_requests
                    SET status = 'implemented', updated_at = NOW()
                    WHERE id = $1
                `, [id]);

                await client.query(`
                    INSERT INTO app_request_history (request_id, status, changed_by, note)
                    VALUES ($1, 'implemented', $2, 'App added to store and assigned')
                `, [id, adminId]);
            }

            await client.query('COMMIT');

            res.json({ 
                message: 'Request approved successfully',
                app_added: !!request.app_id,
                status: request.app_id ? 'implemented' : 'approved'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        logger.error('Error approving request', error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
});

/**
 * POST /api/admin/requests/:id/deny
 * Deny a request
 * Permission: app_requests.deny
 */
router.post('/:id/deny', requirePermission('app_requests.deny'), async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Denial reason is required' });
    }

    try {
        // Get request
        const requestResult = await pool.query(
            'SELECT * FROM app_requests WHERE id = $1',
            [id]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestResult.rows[0];

        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request is not pending' });
        }

        // Update request
        await pool.query(`
            UPDATE app_requests
            SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), deny_reason = $2, updated_at = NOW()
            WHERE id = $3
        `, [adminId, reason.trim(), id]);

        // Add to history
        await pool.query(`
            INSERT INTO app_request_history (request_id, status, changed_by, note)
            VALUES ($1, 'rejected', $2, $3)
        `, [id, adminId, reason.trim()]);

        // Audit log
        await pool.query(`
            INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address)
            VALUES ($1, 'request.rejected', $2, $3, $4)
        `, [adminId, id, JSON.stringify({ user_id: request.user_id, app_id: request.app_id, reason: reason.trim() }), req.ip]);

        res.json({ message: 'Request denied' });

    } catch (error) {
        logger.error('Error denying request', error);
        res.status(500).json({ error: 'Failed to deny request' });
    }
});

export default router;
