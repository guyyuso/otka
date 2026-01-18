import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        env: {
            JWT_SECRET: 'test_secret_key_for_unit_tests',
            DB_HOST: 'localhost',
            DB_NAME: 'secureapps_test'
        }
    },
});
