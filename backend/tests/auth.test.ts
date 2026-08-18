import request from 'supertest';
import app from '../src/app';
import { FIXTURES, TEST_PASSWORD } from './fixtures';

describe('Authentication', () => {
    it('logs in with valid credentials and issues a JWT', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: FIXTURES.superAdmin.email, password: TEST_PASSWORD });
        expect(res.status).toBe(200);
        const token = res.body?.user?.token || res.body?.token;
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT header.payload.signature
    });

    it('rejects a wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: FIXTURES.superAdmin.email, password: 'definitely-wrong' });
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
        expect(res.body?.user?.token).toBeUndefined();
    });

    it('rejects an unknown email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@nowhere.test', password: TEST_PASSWORD });
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });

    it('does not leak whether an email exists (uniform failure)', async () => {
        const wrongPass = await request(app)
            .post('/api/auth/login')
            .send({ email: FIXTURES.superAdmin.email, password: 'wrong' });
        const noUser = await request(app)
            .post('/api/auth/login')
            .send({ email: 'ghost@nowhere.test', password: 'wrong' });
        // Same status for "wrong password" and "no such user" — no user enumeration.
        expect(wrongPass.status).toBe(noUser.status);
    });
});
