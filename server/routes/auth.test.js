import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from './auth';

// Mock the database pool
vi.mock('../db.js', () => ({
    pool: {
        query: vi.fn(),
    },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
    it('POST /api/auth/login - should fail with invalid credentials', async () => {
        // Import the mocked pool to set up its return value
        const { pool } = await import('../db.js');
        pool.query.mockResolvedValueOnce({ rows: [] }); // User not found

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@example.com', password: 'wrong' });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid email or password');
    });

    it('POST /api/auth/login - should fail if email/password missing', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: '' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Email and password are required');
    });
});
