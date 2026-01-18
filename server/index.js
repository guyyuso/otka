import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDatabase } from './db.js';
import { logger } from './logger.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import applicationsRoutes from './routes/applications.js';
import notesRoutes from './routes/notes.js';
import filesRoutes from './routes/files.js';
import adminRoutes from './routes/admin.js';
import adminAppsRoutes from './routes/admin_apps.js';
import adminAssignmentsRoutes from './routes/admin_assignments.js';
import storeRoutes from './routes/store.js';
import adminRequestsRoutes from './routes/admin_requests.js';
import analyticsRoutes from './routes/analytics.js';
import dashboardRoutes from './routes/dashboard.js';
import catalogSyncRoutes from './routes/catalog_sync.js';
import requestsRoutes from './routes/requests.js';
import storeSyncRoutes from './routes/store_sync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

app.use(logger.request); // Log all HTTP requests

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/apps', adminAppsRoutes);
app.use('/api/admin/assignments', adminAssignmentsRoutes);
app.use('/api/store', storeSyncRoutes); // Store sync routes (must be before general store routes)
app.use('/api/store', storeRoutes);
app.use('/api/admin/requests', adminRequestsRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalog', catalogSyncRoutes);
app.use('/api/requests', requestsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
const startServer = async () => {
    try {
        await initDatabase();
        console.log('Database initialized successfully');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
