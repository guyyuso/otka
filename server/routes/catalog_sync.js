// routes/catalog_sync.js
// Catalog Synchronization API
import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logger } from '../logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/catalog/sync
 * Trigger on-demand catalog sync (admin only)
 * Permission: catalog.sync
 */
router.post('/sync', requirePermission('catalog.sync'), async (req, res) => {
    const adminId = req.user.id;
    const syncId = uuidv4();
    const startTime = new Date();

    try {
        // Get sync configuration
        const settingsResult = await pool.query(
            'SELECT value FROM system_settings WHERE key = $1',
            ['catalog_sync_enabled']
        );
        const syncEnabled = settingsResult.rows[0]?.value !== 'false';

        if (!syncEnabled) {
            return res.status(400).json({ error: 'Catalog sync is disabled' });
        }

        // Create sync log entry
        await pool.query(`
            INSERT INTO catalog_sync_logs (sync_id, start_time, status, sync_mode, triggered_by)
            VALUES ($1, $2, 'running', 'on_demand', $3)
        `, [syncId, startTime, adminId]);

        // Perform sync (async - don't wait)
        performCatalogSync(syncId, adminId, startTime).catch(error => {
            logger.error('Catalog sync failed', error);
        });

        res.json({
            message: 'Catalog sync started',
            sync_id: syncId,
            status: 'running'
        });

    } catch (error) {
        logger.error('Error starting catalog sync', error);
        res.status(500).json({ error: 'Failed to start catalog sync' });
    }
});

/**
 * GET /api/catalog/sync/logs
 * Get catalog sync logs (admin only)
 * Permission: catalog.sync
 */
router.get('/sync/logs', requirePermission('catalog.sync'), async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await pool.query(`
            SELECT 
                csl.*,
                u.email as triggered_by_email,
                u.full_name as triggered_by_name
            FROM catalog_sync_logs csl
            LEFT JOIN users u ON csl.triggered_by = u.id
            ORDER BY csl.start_time DESC
            LIMIT $1 OFFSET $2
        `, [parseInt(limit), parseInt(offset)]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching sync logs', error);
        res.status(500).json({ error: 'Failed to fetch sync logs' });
    }
});

/**
 * GET /api/catalog/sync/status
 * Get current sync status and configuration
 */
router.get('/sync/status', requirePermission('catalog.sync'), async (req, res) => {
    try {
        // Get settings
        const settingsResult = await pool.query(`
            SELECT key, value FROM system_settings 
            WHERE key IN ('catalog_sync_enabled', 'catalog_sync_frequency_hours', 'catalog_sync_last_run')
        `);

        const settings = {};
        settingsResult.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        // Get last sync
        const lastSyncResult = await pool.query(`
            SELECT * FROM catalog_sync_logs
            ORDER BY start_time DESC
            LIMIT 1
        `);

        res.json({
            settings,
            last_sync: lastSyncResult.rows[0] || null
        });
    } catch (error) {
        logger.error('Error fetching sync status', error);
        res.status(500).json({ error: 'Failed to fetch sync status' });
    }
});

/**
 * PUT /api/catalog/sync/settings
 * Update sync configuration
 */
router.put('/sync/settings', requirePermission('catalog.sync'), async (req, res) => {
    try {
        const { sync_enabled, frequency_hours } = req.body;
        const adminId = req.user.id;

        if (sync_enabled !== undefined) {
            await pool.query(`
                UPDATE system_settings
                SET value = $1, updated_by = $2, updated_at = NOW()
                WHERE key = 'catalog_sync_enabled'
            `, [String(sync_enabled), adminId]);
        }

        if (frequency_hours !== undefined) {
            await pool.query(`
                UPDATE system_settings
                SET value = $1, updated_by = $2, updated_at = NOW()
                WHERE key = 'catalog_sync_frequency_hours'
            `, [String(frequency_hours), adminId]);
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        logger.error('Error updating sync settings', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

/**
 * Perform catalog sync
 * This function simulates syncing with a master catalog
 * In production, this would connect to the actual master catalog API/service
 */
async function performCatalogSync(syncId, triggeredBy, startTime) {
    const client = await pool.connect();
    let appsAdded = 0;
    let appsUpdated = 0;
    let appsMarkedUnavailable = 0;
    const errors = [];

    try {
        await client.query('BEGIN');

        // TODO: In production, this would fetch from master catalog API
        // For now, we'll simulate by syncing existing apps
        const masterCatalogApps = await client.query(`
            SELECT * FROM application_tiles
            WHERE app_identifier IS NOT NULL
        `);

        // Get current store apps
        const storeApps = await client.query(`
            SELECT * FROM application_tiles
            WHERE is_available_in_store = true
        `);

        const storeAppsByIdentifier = {};
        storeApps.rows.forEach(app => {
            if (app.app_identifier) {
                storeAppsByIdentifier[app.app_identifier] = app;
            }
        });

        // Process each master catalog app
        for (const masterApp of masterCatalogApps.rows) {
            try {
                const identifier = masterApp.app_identifier;
                const existingStoreApp = storeAppsByIdentifier[identifier];

                if (!existingStoreApp) {
                    // Add new app to store
                    await client.query(`
                        UPDATE application_tiles
                        SET 
                            is_available_in_store = true,
                            master_catalog_synced_at = NOW(),
                            sync_status = 'synced',
                            updated_at = NOW()
                        WHERE id = $1
                    `, [masterApp.id]);
                    appsAdded++;
                } else {
                    // Update existing app metadata
                    await client.query(`
                        UPDATE application_tiles
                        SET 
                            name = COALESCE($1, name),
                            description = COALESCE($2, description),
                            short_description = COALESCE($3, short_description),
                            category = COALESCE($4, category),
                            version = COALESCE($5, version),
                            publisher = COALESCE($6, publisher),
                            tags = COALESCE($7, tags),
                            master_catalog_synced_at = NOW(),
                            sync_status = 'synced',
                            updated_at = NOW()
                        WHERE id = $8
                    `, [
                        masterApp.name,
                        masterApp.description,
                        masterApp.short_description,
                        masterApp.category,
                        masterApp.version,
                        masterApp.publisher,
                        masterApp.tags,
                        existingStoreApp.id
                    ]);
                    appsUpdated++;
                }
            } catch (error) {
                errors.push({
                    app_identifier: masterApp.app_identifier,
                    error: error.message
                });
            }
        }

        // Mark apps as unavailable if they're not in master catalog
        // (This is a simplified version - in production, you'd compare against master catalog)
        await client.query(`
            UPDATE application_tiles
            SET 
                is_available_in_store = false,
                sync_status = 'unavailable',
                updated_at = NOW()
            WHERE is_available_in_store = true
            AND master_catalog_synced_at < NOW() - INTERVAL '1 day'
            AND sync_status != 'unavailable'
        `);

        const endTime = new Date();

        // Update sync log
        await client.query(`
            UPDATE catalog_sync_logs
            SET 
                end_time = $1,
                status = 'completed',
                apps_added = $2,
                apps_updated = $3,
                apps_marked_unavailable = $4,
                errors = $5
            WHERE sync_id = $6
        `, [endTime, appsAdded, appsUpdated, appsMarkedUnavailable, JSON.stringify(errors), syncId]);

        // Update last run timestamp
        await client.query(`
            UPDATE system_settings
            SET value = $1, updated_at = NOW()
            WHERE key = 'catalog_sync_last_run'
        `, [startTime.toISOString()]);

        await client.query('COMMIT');

        logger.info('Catalog sync completed', {
            syncId,
            appsAdded,
            appsUpdated,
            appsMarkedUnavailable,
            errors: errors.length
        });

    } catch (error) {
        await client.query('ROLLBACK');
        const endTime = new Date();

        await client.query(`
            UPDATE catalog_sync_logs
            SET 
                end_time = $1,
                status = 'failed',
                errors = $2
            WHERE sync_id = $3
        `, [endTime, JSON.stringify([{ error: error.message }]), syncId]);

        throw error;
    } finally {
        client.release();
    }
}

export default router;

