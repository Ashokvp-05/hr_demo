/**
 * Runs once before the whole suite: ensures the schema exists and seeds two
 * isolated tenants with known-password users so tests are deterministic.
 */
import './test-env';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { FIXTURES, TEST_PASSWORD } from './fixtures';

export default async function globalSetup() {
    // Ensure the database schema is present (no-op if already in sync).
    try {
        execSync('npx prisma db push --skip-generate', {
            cwd: process.cwd(),
            stdio: 'ignore',
            env: process.env,
        });
    } catch {
        // If push fails (e.g. offline), assume schema already exists.
    }

    const prisma = new PrismaClient();
    const password = await bcrypt.hash(TEST_PASSWORD, 12);

    const ensureCompany = (c: { name: string; subdomain: string }) =>
        prisma.company.upsert({
            where: { subdomain: c.subdomain },
            update: {},
            create: { name: c.name, subdomain: c.subdomain, status: 'ACTIVE' },
        });

    const ensureRole = (name: string, companyId: string) =>
        prisma.role.upsert({
            where: { name_companyId: { name, companyId } },
            update: {},
            create: { name, companyId, permissions: { all: name !== 'EMPLOYEE' } as any },
        });

    const ensureUser = async (
        u: { name: string; email: string; role: string },
        companyId: string
    ) => {
        const role = await ensureRole(u.role, companyId);
        await prisma.user.upsert({
            where: { email: u.email },
            update: { password, roleId: role.id, companyId, status: 'ACTIVE', name: u.name },
            create: {
                email: u.email,
                name: u.name,
                password,
                roleId: role.id,
                companyId,
                status: 'ACTIVE',
                emailVerified: true,
            },
        });
    };

    const companyA = await ensureCompany(FIXTURES.companyA);
    const companyB = await ensureCompany(FIXTURES.companyB);

    await ensureUser(FIXTURES.superAdmin, companyA.id);
    await ensureUser(FIXTURES.adminA, companyA.id);
    await ensureUser(FIXTURES.employeeA, companyA.id);
    await ensureUser(FIXTURES.employeeB, companyB.id);

    await prisma.$disconnect();
}
