import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('should show login page and allow login attempt', async ({ page }) => {
        await page.goto('/login');

        // Check if login heading is visible
        await expect(page.getByRole('heading', { name: /Sign in to your account/i })).toBeVisible();

        // Fill in credentials
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password123');

        // Click sign in
        await page.click('button:has-text("Sign in")');

        // Since we don't have a real backend running with these credentials, 
        // we expect an error message to appear
        await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
    });
});
