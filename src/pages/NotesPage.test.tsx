import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotesPage from './NotesPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Header
vi.mock('../components/Header', () => ({
    default: () => <div data-testid="header">Header</div>,
}));

// Mock API
vi.mock('../lib/api', () => ({
    notesApi: {
        get: vi.fn().mockResolvedValue({ content: 'Initial Notes' }),
        save: vi.fn().mockResolvedValue({ id: '1' }),
    },
}));

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1' },
    }),
}));

describe('NotesPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads notes on mount', async () => {
        render(
            <BrowserRouter>
                <NotesPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Start writing your notes here/i)).toHaveValue('Initial Notes');
        });
    });

    it('saves notes when clicking Save button', async () => {
        const { notesApi } = await import('../lib/api');
        render(
            <BrowserRouter>
                <NotesPage />
            </BrowserRouter>
        );

        const textarea = screen.getByPlaceholderText(/Start writing your notes here/i);
        fireEvent.change(textarea, { target: { value: 'Updated Notes' } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(notesApi.save).toHaveBeenCalledWith('Updated Notes', undefined);
            expect(screen.getByText(/Last saved:/i)).toBeInTheDocument();
        });
    });
});
