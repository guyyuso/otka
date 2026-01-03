import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get user's notes
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
            [req.user.userId]
        );
        res.json(result.rows[0] || null);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Save notes (create or update)
router.post('/', authMiddleware, async (req, res) => {
    const { content, noteId } = req.body;

    try {
        if (noteId) {
            // Update existing note
            const result = await pool.query(
                `UPDATE notes SET content = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
                [content, noteId, req.user.userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Note not found' });
            }

            res.json(result.rows[0]);
        } else {
            // Create new note
            const result = await pool.query(
                `INSERT INTO notes (user_id, content) VALUES ($1, $2) RETURNING *`,
                [req.user.userId, content]
            );
            res.status(201).json(result.rows[0]);
        }
    } catch (error) {
        console.error('Save notes error:', error);
        res.status(500).json({ error: 'Failed to save notes' });
    }
});

export default router;
