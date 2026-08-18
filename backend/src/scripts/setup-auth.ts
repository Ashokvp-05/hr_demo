import prisma from '../config/db';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('--- Initializing Roles and Users ---');

    // 0. Ensure a company exists
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: { name: 'Default Company', subdomain: 'default' }
        });
    }

    // 1. Create Roles (Use findFirst + create as Upsert needs composite key)
    let adminRole = await prisma.role.findFirst({
        where: { name: 'ADMIN', companyId: company.id }
    });
    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: { name: 'ADMIN', permissions: { all: true }, companyId: company.id }
        });
    }

    let employeeRole = await prisma.role.findFirst({
        where: { name: 'EMPLOYEE', companyId: company.id }
    });
    if (!employeeRole) {
        employeeRole = await prisma.role.create({
            data: { name: 'EMPLOYEE', permissions: { all: false, self: true }, companyId: company.id }
        });
    }

    console.log('Roles created/confirmed for default company');

    // 2. Create Admin User
    const adminPass = 'admin123';
    const hashedAdminPass = await bcrypt.hash(adminPass, 12);
    await prisma.user.upsert({
        where: { email: 'admin@hrsystem.com' },
        update: {
            password: hashedAdminPass,
            roleId: adminRole.id,
            status: 'ACTIVE'
        },
        create: {
            email: 'admin@hrsystem.com',
            name: 'System Admin',
            password: hashedAdminPass,
            roleId: adminRole.id,
            status: 'ACTIVE'
        }
    });

    // 3. Create Employee User
    const employeePass = 'employee123';
    const hashedEmployeePass = await bcrypt.hash(employeePass, 12);
    await prisma.user.upsert({
        where: { email: 'employee@hrsystem.com' },
        update: {
            password: hashedEmployeePass,
            roleId: employeeRole.id,
            status: 'ACTIVE'
        },
        create: {
            email: 'employee@hrsystem.com',
            name: 'John Employee',
            password: hashedEmployeePass,
            roleId: employeeRole.id,
            status: 'ACTIVE'
        }
    });

    console.log('\n--- Setup Complete ---');
    console.log('Admin: admin@hrsystem.com / admin123');
    console.log('Employee: employee@hrsystem.com / employee123');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
