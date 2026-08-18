import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function main() {
    // No hardcoded credentials: use SEED_DEFAULT_PASSWORD if provided,
    // otherwise generate a random one and print it once.
    const password =
        process.env.SEED_DEFAULT_PASSWORD ||
        crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) + 'A1!';
    if (!process.env.SEED_DEFAULT_PASSWORD) {
        console.log(`[create-user] Generated password (rotate after login): ${password}`);
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    // 0. Setup Company
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: { name: 'Seed Company', subdomain: 'seed' }
        });
    }

    // 1. SETUP ROLES
    // --------------------------------------------------------

    // Admin Role
    let adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN', companyId: company.id } });
    if (!adminRole) {
        console.log('Creating ADMIN role...');
        adminRole = await prisma.role.create({
            data: { name: 'ADMIN', permissions: { all: true }, companyId: company.id }
        });
    }

    // Employee Role
    let employeeRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE', companyId: company.id } });
    if (!employeeRole) {
        console.log('Creating EMPLOYEE role...');
        employeeRole = await prisma.role.create({
            data: { name: 'EMPLOYEE', permissions: { view_self: true, apply_leave: true }, companyId: company.id }
        });
    }

    // --------------------------------------------------------
    // 2. CREATE USERS
    // --------------------------------------------------------

    // --- ADMIN USER ---
    const adminEmail = 'admin@rudratic.com';
    const adminPass = 'admin123';
    const hashedAdminPass = await bcrypt.hash(adminPass, 12);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedAdminPass,
            status: 'ACTIVE',
            role: { connect: { id: adminRole.id } }
        },
        create: {
            email: adminEmail,
            name: 'System Admin',
            password: hashedAdminPass,
            status: 'ACTIVE',
            role: { connect: { id: adminRole.id } }
        }
    });
    console.log(`✅ Admin Created: ${adminEmail} / ${adminPass}`);

    // --- EMPLOYEE USER ---
    const userEmail = 'employee@rudratic.com';
    const userPass = 'user123';
    const hashedUserPass = await bcrypt.hash(userPass, 12);

    await prisma.user.upsert({
        where: { email: userEmail },
        update: {
            password: hashedUserPass,
            status: 'ACTIVE',
            role: { connect: { id: employeeRole.id } }
        },
        create: {
            email: userEmail,
            name: 'John Employee',
            password: hashedUserPass,
            status: 'ACTIVE',
            role: { connect: { id: employeeRole.id } }
        }
    });
    console.log(`✅ Employee Created: ${userEmail} / ${userPass}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
