/**
 * Centralised, validated environment configuration.
 *
 * Reading secrets through this module guarantees the application can never
 * silently fall back to a hardcoded/guessable default: if a required secret
 * is missing (or too weak in production) the process fails fast at startup
 * instead of issuing forgeable tokens.
 */
import dotenv from 'dotenv';

// Load .env before reading anything, regardless of import order.
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

/** Return a required env var, or throw so the app refuses to start. */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim() === '') {
        throw new Error(
            `[config] Required environment variable "${name}" is not set. ` +
            `Refusing to start with an insecure default — set "${name}" in your environment.`
        );
    }
    return value;
}

/**
 * Single source of truth for the JWT signing secret. Shared across every
 * module so tokens verify consistently, and never defaulted to a literal.
 */
export const JWT_SECRET: string = requireEnv('JWT_SECRET');

// Enforce adequate entropy. Fatal in production, a warning in development.
if (JWT_SECRET.length < 32) {
    const msg = '[config] JWT_SECRET should be at least 32 characters for adequate entropy.';
    if (isProd) {
        throw new Error(msg + ' Refusing to start in production with a weak secret.');
    }
    // eslint-disable-next-line no-console
    console.warn(msg);
}

/**
 * Access-token lifetime. Configurable so operators can shorten it (a shorter
 * window limits the blast radius of a leaked token). Defaults to 7d to preserve
 * current behaviour; the `tokenVersion` claim allows immediate revocation.
 */
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
