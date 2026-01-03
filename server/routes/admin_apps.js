import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logger } from '../logger.js';

const router = express.Router();

// Middleware: All routes here require auth
router.use(authMiddleware);

/**
 * GET /api/admin/apps
 * List all application tiles
 * Permission: apps.view
 */
router.get('/', requirePermission('apps.view'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM application_tiles ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching app tiles', error);
        res.status(500).json({ error: 'Failed to fetch application tiles' });
    }
});

/**
 * POST /api/admin/apps
 * Create a new application tile
 * Permission: apps.manage
 */
router.post('/', requirePermission('apps.manage'), async (req, res) => {
    const {
        name, description, short_description, category, logo_url, icon_url, launch_url,
        auth_type, config, tags, publisher, is_available_in_store, requires_approval
    } = req.body;

    if (!name || !launch_url) {
        return res.status(400).json({ error: 'Name and Launch URL are required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO application_tiles 
            (name, description, short_description, category, logo_url, icon_url, launch_url, 
             auth_type, config, tags, publisher, is_available_in_store, requires_approval, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
            RETURNING *`,
            [
                name, description, short_description, category || 'General', logo_url, icon_url, launch_url,
                auth_type || 'none', config || {}, tags || [], publisher,
                is_available_in_store || false, requires_approval || false, req.user.id
            ]
        );

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address) 
             VALUES ($1, 'app.create', $2, $3, $4)`,
            [req.user.id, result.rows[0].id, JSON.stringify(req.body), req.ip]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating app tile', error);
        res.status(500).json({ error: 'Failed to create application tile' });
    }
});

/**
 * PUT /api/admin/apps/:id
 * Update an application tile
 * Permission: apps.manage
 */
router.put('/:id', requirePermission('apps.manage'), async (req, res) => {
    const { id } = req.params;
    const {
        name, description, short_description, category, logo_url, icon_url, launch_url,
        auth_type, config, tags, publisher, is_available_in_store, requires_approval, status
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE application_tiles 
             SET name = $1, description = $2, short_description = $3, category = $4, 
                 logo_url = $5, icon_url = $6, launch_url = $7, auth_type = $8, config = $9,
                 tags = $10, publisher = $11, is_available_in_store = $12, requires_approval = $13,
                 status = $14, updated_at = NOW()
             WHERE id = $15 
             RETURNING *`,
            [
                name, description, short_description, category, logo_url, icon_url, launch_url,
                auth_type, config, tags, publisher, is_available_in_store, requires_approval,
                status || 'active', id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application tile not found' });
        }

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address) 
             VALUES ($1, 'app.update', $2, $3, $4)`,
            [req.user.id, id, JSON.stringify(req.body), req.ip]
        );

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating app tile', error);
        res.status(500).json({ error: 'Failed to update application tile' });
    }
});

/**
 * DELETE /api/admin/apps/:id
 * Delete an application tile
 * Permission: apps.manage
 */
router.delete('/:id', requirePermission('apps.manage'), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM application_tiles WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application tile not found' });
        }

        // Audit Log
        await pool.query(
            `INSERT INTO audit_logs (actor_id, action, target_id, ip_address) 
             VALUES ($1, 'app.delete', $2, $3)`,
            [req.user.id, id, req.ip]
        );

        res.json({ message: 'Application tile deleted successfully' });
    } catch (error) {
        logger.error('Error deleting app tile', error);
        res.status(500).json({ error: 'Failed to delete application tile' });
    }
});

export default router;
