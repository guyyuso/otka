// routes/store_sync.js
// Sync Application Catalog to Store
import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logger } from '../logger.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/store/sync
 * Sync all active apps from catalog to store
 * Permission: apps.manage or catalog.sync
 */
router.post('/sync', requirePermission('apps.manage'), async (req, res) => {
    try {
        // Get all active apps from catalog
        const catalogApps = await pool.query(`
            SELECT id, name, status 
            FROM application_tiles 
            WHERE status = 'active'
        `);

        // Make all active apps available in store
        const result = await pool.query(`
            UPDATE application_tiles
            SET 
                is_available_in_store = true,
                updated_at = NOW()
            WHERE status = 'active'
            AND (is_available_in_store IS NULL OR is_available_in_store = false)
        `);

        // Audit log
        await pool.query(`
            INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address)
            VALUES ($1, 'store.sync', NULL, $2, $3)
        `, [
            req.user.id,
            JSON.stringify({ 
                apps_synced: result.rowCount,
                total_catalog_apps: catalogApps.rows.length
            }),
            req.ip
        ]);

        res.json({
            message: 'Store synced successfully',
            apps_synced: result.rowCount,
            total_catalog_apps: catalogApps.rows.length
        });

    } catch (error) {
        logger.error('Error syncing store', error);
        res.status(500).json({ error: 'Failed to sync store' });
    }
});

/**
 * GET /api/store/sync/status
 * Get sync status (how many apps in catalog vs store)
 */
router.get('/sync/status', requirePermission('apps.view'), async (req, res) => {
    try {
        const catalogCount = await pool.query(`
            SELECT COUNT(*) as count 
            FROM application_tiles 
            WHERE status = 'active'
        `);

        const storeCount = await pool.query(`
            SELECT COUNT(*) as count 
            FROM application_tiles 
            WHERE status = 'active' AND is_available_in_store = true
        `);

        res.json({
            catalog_apps: parseInt(catalogCount.rows[0].count),
            store_apps: parseInt(storeCount.rows[0].count),
            unsynced: parseInt(catalogCount.rows[0].count) - parseInt(storeCount.rows[0].count)
        });
    } catch (error) {
        logger.error('Error fetching sync status', error);
        res.status(500).json({ error: 'Failed to fetch sync status' });
    }
});

export default router;

