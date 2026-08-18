/**
 * Rate limiting middleware.
 *
 * - `apiLimiter`  : a sane global ceiling applied to the whole API.
 * - `authLimiter` : a strict limiter for authentication endpoints
 *                   (login, register, password reset, 2FA) to blunt brute-force
 *                   and credential-stuffing attacks.
 *
 * Limits can be tuned via env vars without code changes.
 */
import { rateLimit } from 'express-rate-limit';

const num = (v: string | undefined, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Global API limiter — generous, only stops obvious abuse/scraping.
export const apiLimiter = rateLimit({
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 min
    max: num(process.env.RATE_LIMIT_MAX, 1000),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

// Relaxed limiter for demo/auth endpoints — still prevents obvious abuse.
export const authLimiter = rateLimit({
    windowMs: num(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000), // 5 min window
    max: num(process.env.AUTH_RATE_LIMIT_MAX, 100),                       // 100 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,  // Successful logins don't count toward the limit
    message: { error: 'Too many attempts. Please wait 5 minutes before trying again.' },
});
