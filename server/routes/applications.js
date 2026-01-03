import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { decrypt } from '../utils/encryption.js';

const router = express.Router();

// Get assigned applications for current user
router.get('/assigned', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                ua.id, 
                ua.app_id, 
                at.name, 
                at.url, 
                at.logo_url, 
                at.category,
                at.auth_type,
                ua.app_username, 
                ua.app_password_encrypted,
                ua.created_at
            FROM user_app_assignments ua
            JOIN application_tiles at ON ua.app_id = at.id
            WHERE ua.user_id = $1
            ORDER BY at.name ASC`,
            [req.user.userId]
        );

        const assignedApps = result.rows.map(app => ({
            ...app,
            password: app.app_password_encrypted ? decrypt(app.app_password_encrypted) : null,
            app_password_encrypted: undefined // Don't send encrypted blob
        }));

        res.json(assignedApps);
    } catch (error) {
        console.error('Get assigned applications error:', error);
        res.status(500).json({ error: 'Failed to fetch assigned applications' });
    }
});

// Get all applications for current user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM applications WHERE user_id = $1 ORDER BY last_used DESC NULLS LAST, created_at DESC`,
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Create application
router.post('/', authMiddleware, async (req, res) => {
    const { name, url, logoUrl, username, password, category } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Application name is required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO applications (user_id, name, url, logo_url, username, password, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [req.user.userId, name, url, logoUrl, username, password, category || 'General']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ error: 'Failed to create application' });
    }
});

// Update application
router.put('/:id', authMiddleware, async (req, res) => {
    const { name, url, logoUrl, username, password, category } = req.body;

    try {
        const result = await pool.query(
            `UPDATE applications 
       SET name = COALESCE($1, name),
           url = COALESCE($2, url),
           logo_url = COALESCE($3, logo_url),
           username = COALESCE($4, username),
           password = COALESCE($5, password),
           category = COALESCE($6, category),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
            [name, url, logoUrl, username, password, category, req.params.id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

// Update last used
router.post('/:id/access', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE applications SET last_used = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
            [req.params.id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update last used error:', error);
        res.status(500).json({ error: 'Failed to update application' });
    }
});

// Delete application
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ error: 'Failed to delete application' });
    }
});

export default router;
