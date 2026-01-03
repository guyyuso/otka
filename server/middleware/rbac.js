import { pool } from '../db.js';

/**
 * Middleware to enforce Permission verification.
 * Assumes req.user is populated by authMiddleware (contains role property).
 * 
 * @param {string} permissionSlug - The permission slug required (e.g., 'users.view')
 */
export const requirePermission = (permissionSlug) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                return res.status(401).json({ error: 'Unauthorized: No user role found' });
            }

            // Super Admin bypass (optimization, though they have all perms in DB too)
            if (req.user.role === 'super_admin') {
                return next();
            }

            // Check DB for permission
            const query = `
                SELECT 1 
                FROM role_permissions rp
                JOIN roles r ON rp.role_id = r.id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE r.name = $1 AND p.slug = $2
            `;

            const result = await pool.query(query, [req.user.role, permissionSlug]);

            if (result.rows.length > 0) {
                return next();
            } else {
                return res.status(403).json({ error: `Forbidden: Missing permission ${permissionSlug}` });
            }
        } catch (error) {
            console.error(`RBAC Error checking ${permissionSlug}:`, error);
            return res.status(500).json({ error: 'Internal Server Error during authorization' });
        }
    };
};
