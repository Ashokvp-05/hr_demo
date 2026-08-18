import request from 'supertest';
import app from '../src/app';
import { login, bearer } from './helpers';
import { FIXTURES } from './fixtures';

/**
 * Tenant isolation (M4): a company admin must only ever see their own
 * company's data. Company A's admin listing employees must include Company A's
 * employee and must NOT include Company B's employee.
 */
describe('Multi-tenant isolation', () => {
    it("company A admin cannot see company B's users", async () => {
        const token = await login(app, FIXTURES.adminA.email);
        const res = await request(app)
            .get('/api/admin/employees')
            .set('Authorization', bearer(token));

        expect(res.status).toBe(200);

        const body = JSON.stringify(res.body);
        expect(body).toContain(FIXTURES.employeeA.email); // own tenant present
        expect(body).not.toContain(FIXTURES.employeeB.email); // other tenant absent
    });
});
