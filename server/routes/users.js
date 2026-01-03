import express from 'express';
import { pool } from '../db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role, status, created_at, updated_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows.map(user => ({
            id: user.id,
            email: user.email,
            name: user.full_name,
            role: user.role,
            status: user.status,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        })));
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Search users by name or email (admin only) - for autocomplete
router.get('/search', authMiddleware, adminMiddleware, async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 1) {
        return res.json([]);
    }

    try {
        const result = await pool.query(
            `SELECT id, email, full_name, role, status 
             FROM users 
             WHERE (full_name ILIKE $1 OR email ILIKE $1)
             AND status = 'active'
             ORDER BY full_name ASC
             LIMIT $2`,
            [`${q}%`, parseInt(limit)]
        );

        res.json(result.rows.map(user => ({
            id: user.id,
            email: user.email,
            name: user.full_name,
            role: user.role,
            status: user.status
        })));
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role, status, created_at FROM users WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            name: user.full_name,
            role: user.role,
            status: user.status,
            createdAt: user.created_at
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user (admin, super_admin or self)
router.put('/:id', authMiddleware, async (req, res) => {
    const { fullName, role, status } = req.body;
    const userId = req.params.id;
    const requestorRole = req.user.role;

    // Self update (name only)
    if (req.user.userId === userId) {
        // Users cannot change their own role or status
        if (role || status) {
            // If they are trying to change role/status and NOT an admin/super_admin, deny
            if (requestorRole !== 'admin' && requestorRole !== 'super_admin') {
                return res.status(403).json({ error: 'Not authorized to change role or status' });
            }
        }
    } else {
        // Updating someone else
        if (requestorRole !== 'admin' && requestorRole !== 'super_admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Admin cannot update other admins or super_admins
        // Check target user role first
        if (requestorRole === 'admin') {
            const targetUser = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
            if (targetUser.rows.length > 0) {
                const targetRole = targetUser.rows[0].role;
                if (targetRole === 'admin' || targetRole === 'super_admin') {
                    return res.status(403).json({ error: 'Admins cannot modify other admins or super admins' });
                }
            }
            // Admin cannot promote to admin or super_admin
            if (role === 'admin' || role === 'super_admin') {
                return res.status(403).json({ error: 'Admins cannot promote users to admin roles' });
            }
        }
    }

    try {
        let query, params;

        // If authorized (checked above), proceed
        query = `
        UPDATE users 
        SET full_name = COALESCE($1, full_name),
            role = COALESCE($2, role),
            status = COALESCE($3, status),
            updated_at = NOW()
        WHERE id = $4
        RETURNING id, email, full_name, role, status, created_at
      `;
        // If regular user, ignore role/status changes even if sent
        if (requestorRole === 'user') {
            query = `
                UPDATE users 
                SET full_name = COALESCE($1, full_name),
                    updated_at = NOW()
                WHERE id = $2
                RETURNING id, email, full_name, role, status, created_at
              `;
            params = [fullName, userId];
        } else {
            params = [fullName, role, status, userId];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            name: user.full_name,
            role: user.role,
            status: user.status,
            createdAt: user.created_at
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
