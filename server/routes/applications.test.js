import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import applicationsRouter from './applications';

// Mock the database pool
vi.mock('../db.js', () => ({
    pool: {
        query: vi.fn(),
    },
}));

// Mock the auth middleware to bypass it and set req.user
vi.mock('../middleware/auth.js', () => ({
    authMiddleware: (req, res, next) => {
        req.user = { userId: 'test-user-id' };
        next();
    },
}));

const app = express();
app.use(express.json());
app.use('/api/applications', applicationsRouter);

describe('Applications Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET /api/applications - should return user applications', async () => {
        const { pool } = await import('../db.js');
        const mockApps = [
            { id: '1', name: 'App 1', url: 'http://test.com' },
            { id: '2', name: 'App 2', url: 'http://test2.com' }
        ];

        pool.query.mockResolvedValueOnce({ rows: mockApps });

        const response = await request(app).get('/api/applications');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockApps);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM applications'),
            ['test-user-id']
        );
    });

    it('POST /api/applications - should create a new application', async () => {
        const { pool } = await import('../db.js');
        const newApp = { name: 'New App', url: 'http://new.com' };

        pool.query.mockResolvedValueOnce({ rows: [{ id: '3', ...newApp }] });

        const response = await request(app)
            .post('/api/applications')
            .send(newApp);

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('New App');
        expect(pool.query).toHaveBeenCalled();
    });

    it('POST /api/applications - should fail if name is missing', async () => {
        const response = await request(app)
            .post('/api/applications')
            .send({ url: 'http://noname.com' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Application name is required');
    });
});
