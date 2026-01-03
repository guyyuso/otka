import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get user's files
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM files WHERE user_id = $1 ORDER BY uploaded_at DESC',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// Upload file metadata (actual file upload would need multer or similar)
router.post('/', authMiddleware, async (req, res) => {
    const { name, size, type, url, storagePath } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'File name is required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO files (user_id, name, size, type, url, storage_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [req.user.userId, name, size, type, url, storagePath]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ error: 'Failed to save file metadata' });
    }
});

// Delete file
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM files WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({ message: 'File deleted successfully', file: result.rows[0] });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
