import request from 'supertest';
import app from '../src/app';

describe('Health & hardening', () => {
    it('GET /health returns 200 ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('sends security headers (helmet)', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBeDefined();
        expect(res.headers['content-security-policy']).toBeDefined();
    });

    it('does not disclose the framework via x-powered-by', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('returns a clean 404 for unknown routes', async () => {
        const res = await request(app).get('/api/does-not-exist-xyz');
        expect(res.status).toBe(404);
    });
});
