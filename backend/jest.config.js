/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    globalSetup: '<rootDir>/tests/globalSetup.ts',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    // otplib ships ESM that ts-jest won't transform; 2FA isn't under test.
    moduleNameMapper: {
        '^otplib$': '<rootDir>/tests/__mocks__/otplib.ts',
    },
    // Run serially so the shared test database isn't mutated concurrently.
    maxWorkers: 1,
    testTimeout: 30000,
    // Cron/DB handles can linger; fail loudly but don't hang CI.
    forceExit: true,
    clearMocks: true,
    verbose: true,
};
