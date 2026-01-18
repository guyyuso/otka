# Unit Testing Guide

This document provides instructions on how to set up and run unit tests for both the frontend and the backend of the Otka application.

## 1. Frontend Testing (Vitest + React Testing Library)

The frontend uses **Vitest** as the test runner and **React Testing Library** for component testing.

### Installation

> [!NOTE]
> All necessary dependencies have already been installed in this project. You can skip this step unless you are setting up a new environment.

```bash
# Frontend
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Backend
cd server
npm install -D vitest supertest
```

### Configuration

Modify `vite.config.ts` to include the test configuration:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

Create a setup file at `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

### Adding Scripts

Add the following to your root `package.json`:

```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run"
}
```

---

## 2. Backend Testing (Supertest + Vitest)

We will also use **Vitest** for the backend to keep it consistent, along with **Supertest** for API testing.

### Adding Scripts

Add the following to `server/package.json`:

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

---

## 3. Example Tests

### Frontend: Header Component
File: `src/components/Header.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { AuthProvider } from '../contexts/AuthContext';
import { describe, it, expect } from 'vitest';

describe('Header Component', () => {
  it('renders the application title', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByText(/SecureApps/i)).toBeInTheDocument();
  });
});
```

### Backend: Auth Routes
File: `server/routes/auth.test.js`

```javascript
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from './auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  it('POST /api/auth/login - should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrong' });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });
});
```

---

### Additional Frontend Tests
- `src/components/AppTile.test.tsx`: Tests for application launching, credential display, and interaction.
- `src/pages/NotesPage.test.tsx`: Tests for data loading, auto-save, and manual save features.
- `src/lib/api.test.ts`: Tests for the API client, token management, and error handling.

### Additional Backend Tests
- `server/routes/applications.test.js`: Tests for application CRUD operations and authorization.
- `server/routes/admin_requests.test.js`: Tests for administrative approval/denial flows.

---

## 4. How to Run

1. **Frontend Tests**: `npm test` (root)
2. **Backend Tests**: `cd server && npm test`
3. **Specific Test**: `npx vitest run path/to/file.test.ts`
