// API Client for SecureApps Backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string | null) => {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

export const getAuthToken = () => authToken;

// Helper for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers as Record<string, string>),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
    }

    return data;
};

// Auth API
export const authApi = {
    register: async (email: string, password: string, fullName: string) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName }),
        });
        if (data.token) {
            setAuthToken(data.token);
        }
        return data;
    },

    login: async (email: string, password: string) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.token) {
            setAuthToken(data.token);
        }
        return data;
    },

    logout: async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } finally {
            setAuthToken(null);
        }
    },

    getMe: async () => {
        return apiRequest('/auth/me');
    },
};

// Users API
export const usersApi = {
    getAll: async () => {
        return apiRequest('/users');
    },

    search: async (query: string, limit = 10) => {
        return apiRequest(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    },

    getById: async (id: string) => {
        return apiRequest(`/users/${id}`);
    },

    update: async (id: string, data: { fullName?: string; role?: string; status?: string }) => {
        return apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiRequest(`/users/${id}`, { method: 'DELETE' });
    },
};

// Applications API
export const applicationsApi = {
    getAll: async () => {
        return apiRequest('/applications');
    },

    create: async (data: {
        name: string;
        url?: string;
        logoUrl?: string;
        username?: string;
        password?: string;
        category?: string;
    }) => {
        return apiRequest('/applications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: Record<string, unknown>) => {
        return apiRequest(`/applications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    access: async (id: string) => {
        return apiRequest(`/applications/${id}/access`, { method: 'POST' });
    },

    delete: async (id: string) => {
        return apiRequest(`/applications/${id}`, { method: 'DELETE' });
    },
};

// Notes API
export const notesApi = {
    get: async () => {
        return apiRequest('/notes');
    },

    save: async (content: string, noteId?: string) => {
        return apiRequest('/notes', {
            method: 'POST',
            body: JSON.stringify({ content, noteId }),
        });
    },
};

// Files API
export const filesApi = {
    getAll: async () => {
        return apiRequest('/files');
    },

    upload: async (data: { name: string; size: number; type: string; url: string; storagePath: string }) => {
        return apiRequest('/files', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiRequest(`/files/${id}`, { method: 'DELETE' });
    },
};

// Admin API
export const adminApi = {
    getStats: async () => {
        return apiRequest('/admin/stats');
    },

    getLogs: async () => {
        return apiRequest('/admin/logs');
    },

    getSettings: async () => {
        return apiRequest('/admin/settings');
    },

    updateSettings: async (key: string, value: any) => {
        return apiRequest(`/admin/settings/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ value }),
        });
    },

    // Application Tiles Management
    getAppTiles: async () => {
        return apiRequest('/admin/apps');
    },

    createAppTile: async (data: any) => {
        return apiRequest('/admin/apps', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateAppTile: async (id: string, data: any) => {
        return apiRequest(`/admin/apps/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteAppTile: async (id: string) => {
        return apiRequest(`/admin/apps/${id}`, { method: 'DELETE' });
    },

    // User Assignments
    getUserAssignments: async (userId: string) => {
        return apiRequest(`/admin/assignments/users/${userId}`);
    },

    assignAppToUser: async (userId: string, appTileId: string, data?: { appUsername?: string; pin4?: string; requiresPin?: boolean }) => {
        return apiRequest(`/admin/assignments/users/${userId}`, {
            method: 'POST',
            body: JSON.stringify({ appTileId, ...data }),
        });
    },

    unassignAppFromUser: async (userId: string, appTileId: string) => {
        return apiRequest(`/admin/assignments/users/${userId}/apps/${appTileId}`, {
            method: 'DELETE',
        });
    },

    getAppAssignedUsers: async (appTileId: string) => {
        return apiRequest(`/admin/assignments/apps/${appTileId}/users`);
    },

    // App Requests Management
    getRequests: async (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return apiRequest(`/admin/requests${query}`);
    },

    getRequest: async (id: string) => {
        return apiRequest(`/admin/requests/${id}`);
    },

    approveRequest: async (id: string, note?: string) => {
        return apiRequest(`/admin/requests/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    },

    denyRequest: async (id: string, reason: string) => {
        return apiRequest(`/admin/requests/${id}/deny`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },
};

// Store API (User-facing)
export const storeApi = {
    getApps: async () => {
        return apiRequest('/store');
    },

    getApp: async (id: string) => {
        return apiRequest(`/store/${id}`);
    },

    requestApp: async (id: string, reason: string) => {
        return apiRequest(`/store/${id}/request`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    getMyRequests: async () => {
        return apiRequest('/store/my/requests');
    },
};

export const dashboardApi = {
    verifyPin: async (appTileId: string, pin4: string) => {
        return apiRequest(`/dashboard/apps/${appTileId}/verify-pin`, {
            method: 'POST',
            body: JSON.stringify({ pin4 }),
        });
    },

    getPinStatus: async (appTileId: string) => {
        return apiRequest(`/dashboard/apps/${appTileId}/pin-status`);
    },
};

export default { authApi, usersApi, applicationsApi, notesApi, filesApi, adminApi, storeApi, dashboardApi };
