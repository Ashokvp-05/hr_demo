import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { login, bearer } from './helpers';
import { FIXTURES } from './fixtures';

describe('Authorization (auth enforcement + RBAC)', () => {
    it('rejects protected routes with no token (401)', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(401);
    });

    it('rejects a garbage token (401)', async () => {
        const res = await request(app).get('/api/users').set('Authorization', bearer('not.a.jwt'));
        expect(res.status).toBe(401);
    });

    it('rejects a token forged with the old leaked fallback secret (C1)', async () => {
        // Pre-fix, any deployment missing JWT_SECRET accepted this. Must be 401 now.
        const forged = jwt.sign(
            { id: 'attacker', email: 'evil@x.com', role: 'SUPER_ADMIN', companyId: 'x', tokenVersion: 0 },
            'super-secret-key',
            { expiresIn: '1h' }
        );
        const res = await request(app).get('/api/users').set('Authorization', bearer(forged));
        expect(res.status).toBe(401);
    });

    it('allows a super admin to list users (200)', async () => {
        const token = await login(app, FIXTURES.superAdmin.email);
        const res = await request(app).get('/api/users').set('Authorization', bearer(token));
        expect(res.status).toBe(200);
    });

    it('forbids an employee from admin-only routes (403)', async () => {
        const token = await login(app, FIXTURES.employeeA.email);
        const users = await request(app).get('/api/users').set('Authorization', bearer(token));
        const admin = await request(app).get('/api/admin/employees').set('Authorization', bearer(token));
        expect(users.status).toBe(403);
        expect(admin.status).toBe(403);
    });
});
