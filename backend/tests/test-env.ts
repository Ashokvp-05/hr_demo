/**
 * Test environment variables. Required BEFORE importing the app or Prisma so
 * the config layer (JWT secret, DB URL, rate limits) reads test values.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_chars_long_000';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://hr:hrpass@127.0.0.1:5432/swot_hr';

// Generous limits so functional tests never trip the limiter; the dedicated
// rate-limit test overrides AUTH_RATE_LIMIT_MAX before importing the app.
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '100000';
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '100000';

export {};
