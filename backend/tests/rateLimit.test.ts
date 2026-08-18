// Override the auth limit BEFORE importing the app so the limiter picks it up.
process.env.AUTH_RATE_LIMIT_MAX = '5';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';

import request from 'supertest';
import app from '../src/app';
import { FIXTURES } from './fixtures';

/**
 * Rate limiting (H1): repeated failed logins must eventually be throttled with
 * HTTP 429 instead of being processed indefinitely (brute-force protection).
 */
describe('Auth rate limiting', () => {
    it('returns 429 after too many failed login attempts', async () => {
        const attempt = () =>
            request(app)
                .post('/api/auth/login')
                .send({ email: FIXTURES.superAdmin.email, password: 'wrong-password' });

        let saw429 = false;
        for (let i = 0; i < 12; i++) {
            const res = await attempt();
            if (res.status === 429) {
                saw429 = true;
                break;
            }
        }
        expect(saw429).toBe(true);
    });
});
