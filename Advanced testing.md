# Advanced Testing Guide

This guide covers Integration, Contract, E2E, and Deployment Verification tests for the Otka application.

## 1. Integration Tests (Real Database)

Integration tests verify that the API interacts correctly with a real PostgreSQL database.

### Setup
Ensure you have a test database. You can point to it using the `DATABASE_URL` or specific env vars.

### Run
```bash
npm run test:integration
```

---

## 2. Contract Tests (Schema Validation)

Contract tests ensure that the Backend and Frontend agree on the API structure using JSON Schema validation (Ajv).

### Run
```bash
npm run test:contract
```

---

## 3. E2E Tests (Playwright)

End-to-End tests verify the entire user flow in a real browser.

### Installation
If not already done, run:
```bash
npx playwright install --with-deps chromium
```

### Run
```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (Interactive)
npx playwright test --ui
```

---

## 4. Deployment Verification (Smoke Test)

A lightweight script to check if the deployed application is healthy.

### Run
```bash
# Set the target environment URL
export TARGET_URL=https://your-production-url.com
npm run test:deploy
```
