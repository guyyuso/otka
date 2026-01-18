import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi, setAuthToken } from './api';

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        setAuthToken(null);
    });

    it('login should store token in localStorage', async () => {
        const mockToken = 'test-token';
        const mockUser = { id: '1', email: 'test@example.com' };

        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: mockToken, user: mockUser }),
        });

        const data = await authApi.login('test@example.com', 'password');

        expect(data.token).toBe(mockToken);
        expect(localStorage.getItem('authToken')).toBe(mockToken);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/login'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
            })
        );
    });

    it('apiRequest should include Authorization header if token exists', async () => {
        setAuthToken('my-secret-token');

        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        });

        await authApi.getMe();

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer my-secret-token',
                }),
            })
        );
    });

    it('should throw error if response is not ok', async () => {
        (fetch as any).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Unauthorized' }),
        });

        await expect(authApi.getMe()).rejects.toThrow('Unauthorized');
    });
});
