/**
 * Shared test fixture constants. Two tenants (A and B) let us prove that one
 * company's users cannot read another company's data (tenant isolation).
 */
export const TEST_PASSWORD = 'TestPass@2026!';

export const FIXTURES = {
    companyA: { name: 'Test Company A', subdomain: 'test-a' },
    companyB: { name: 'Test Company B', subdomain: 'test-b' },
    superAdmin: { name: 'Test Super', email: 'test.super@example.com', role: 'SUPER_ADMIN' },
    adminA: { name: 'Test Admin A', email: 'test.admin.a@example.com', role: 'ADMIN' },
    employeeA: { name: 'Test Emp A', email: 'test.emp.a@example.com', role: 'EMPLOYEE' },
    employeeB: { name: 'Test Emp B', email: 'test.emp.b@example.com', role: 'EMPLOYEE' },
};
