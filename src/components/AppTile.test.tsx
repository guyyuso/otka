import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppTile from './AppTile';
import { describe, it, expect, vi } from 'vitest';

// Mock useAppData
const mockRemoveApp = vi.fn();
const mockUpdateLastUsed = vi.fn();

vi.mock('../contexts/AppDataContext', () => ({
    useAppData: () => ({
        removeApp: mockRemoveApp,
        updateLastUsed: mockUpdateLastUsed,
    }),
}));

// Mock window.open
vi.stubGlobal('open', vi.fn());
// Mock window.confirm
vi.stubGlobal('confirm', vi.fn(() => true));

describe('AppTile Component', () => {
    const mockApp = {
        id: '1',
        name: 'Test App',
        url: 'https://test.com',
        logo: 'https://test.com/logo.png',
        username: '',
        password: '',
        category: 'general'
    } as any;

    it('renders app name and logo', () => {
        render(<AppTile app={mockApp} />);
        expect(screen.getByText('Test App')).toBeInTheDocument();
        expect(screen.getByAltText('Test App')).toHaveAttribute('src', mockApp.logo);
    });

    it('calls updateLastUsed and window.open on click', async () => {
        render(<AppTile app={mockApp} />);
        fireEvent.click(screen.getByText('Test App'));

        await waitFor(() => {
            expect(mockUpdateLastUsed).toHaveBeenCalledWith('1');
            expect(window.open).toHaveBeenCalledWith(mockApp.url, '_blank');
        });
    });

    it('shows credentials when clicked and available', async () => {
        const appWithCreds = { ...mockApp, username: 'user123' };
        render(<AppTile app={appWithCreds} />);
        fireEvent.click(screen.getByText('Test App'));

        await waitFor(() => {
            expect(screen.getByText('user123')).toBeInTheDocument();
        });
    });
});
