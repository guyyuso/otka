import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

// Define the "Contract" - the schema we expect from the backend
const userResponseSchema = {
    type: 'object',
    properties: {
        user: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                role: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string' }
            },
            required: ['id', 'email', 'name', 'role', 'status']
        },
        token: { type: 'string' }
    },
    required: ['user', 'token']
};

describe('API Contract Validation', () => {
    const validate = ajv.compile(userResponseSchema);

    it('should validate a successful login response', () => {
        const mockResponse = {
            user: {
                id: '550e8400-e29b-41d4-a716-446655440000',
                email: 'user@example.com',
                name: 'Test User',
                role: 'user',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            token: 'jwt-token-string'
        };

        const valid = validate(mockResponse);
        if (!valid) console.error(validate.errors);
        expect(valid).toBe(true);
    });

    it('should fail if required fields are missing', () => {
        const invalidResponse = {
            user: {
                id: 'invalid-uuid',
                email: 'not-an-email'
            }
        };

        const valid = validate(invalidResponse);
        expect(valid).toBe(false);
    });
});
