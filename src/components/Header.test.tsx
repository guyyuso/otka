import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { describe, it, expect, vi } from 'vitest';

// Mock the useAuth hook
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { name: 'Test User', email: 'test@example.com' },
        logout: vi.fn(),
        isAdmin: () => false,
    }),
}));

describe('Header Component', () => {
    it('renders the application title', () => {
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        expect(screen.getByText(/SecureApps/i)).toBeInTheDocument();
    });

    it('renders the user name', () => {
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
});
