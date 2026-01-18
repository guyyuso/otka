import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import adminRequestsRouter from './admin_requests';

// Mock the database pool
vi.mock('../db.js', () => ({
    pool: {
        query: vi.fn(),
        connect: vi.fn(() => ({
            query: vi.fn(),
            release: vi.fn(),
        })),
    },
}));

// Mock the auth middleware
vi.mock('../middleware/auth.js', () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin' };
        next();
    },
}));

// Mock RBAC
vi.mock('../middleware/rbac.js', () => ({
    requirePermission: () => (req, res, next) => next(),
}));

// Mock Logger
vi.mock('../logger.js', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
    },
}));

const app = express();
app.use(express.json());
app.use('/api/admin/requests', adminRequestsRouter);

describe('Admin Requests Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/admin/requests - should return list of requests', async () => {
        const { pool } = await import('../db.js');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 'req-1', status: 'submitted' }] }); // Main query
        pool.query.mockResolvedValueOnce({ rows: [{ status: 'submitted', count: 1 }] }); // Counts query

        const response = await request(app).get('/api/admin/requests');

        expect(response.status).toBe(200);
        expect(response.body.requests).toBeDefined();
        expect(response.body.counts.submitted).toBe(1);
    });

    it('POST /api/admin/requests/:id/deny - should require a reason', async () => {
        const response = await request(app)
            .post('/api/admin/requests/req-1/deny')
            .send({ reason: '' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Denial reason is required');
    });
});
