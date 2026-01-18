/**
 * Deployment Verification / Smoke Test Script
 * This script pings the deployed application and checks for basic health.
 */
import fetch from 'node-fetch';

const targetUrl = process.env.TARGET_URL || 'http://localhost:5173';
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function runSmokeTest() {
    console.log(`--- Starting Smoke Test on ${targetUrl} ---`);

    try {
        // 1. Check Frontend
        const feResponse = await fetch(targetUrl);
        if (feResponse.ok) {
            console.log('✅ Frontend is UP');
        } else {
            console.error(`❌ Frontend is DOWN (Status: ${feResponse.status})`);
            process.exit(1);
        }

        // 2. Check Backend Health
        // We try to ping the register/login endpoints briefly
        const beResponse = await fetch(`${apiBaseUrl}/auth/me`);
        // 401 is actually a good sign - it means the backend is alive and responding with auth requirements
        if (beResponse.status === 401 || beResponse.ok) {
            console.log('✅ Backend API is reachable');
        } else {
            console.error(`❌ Backend API is unreachable (Status: ${beResponse.status})`);
            process.exit(1);
        }

        console.log('--- Deployment Verification PASSED ---');
    } catch (error) {
        console.error('❌ Smoke Test FAILED with error:', error.message);
        process.exit(1);
    }
}

runSmokeTest();
