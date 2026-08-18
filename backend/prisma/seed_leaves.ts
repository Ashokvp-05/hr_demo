import { PrismaClient, LeaveStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Leave Balances...');

    const company = await prisma.company.findFirst({ where: { subdomain: 'default' } });
    if (!company) {
        console.error('Company not found');
        return;
    }

    const employee = await prisma.user.findUnique({ where: { email: 'employee@hrms.com' } });
    if (!employee) {
        console.error('Employee not found');
        return;
    }

    // 1. Create Leave Type Configs if they don't exist
    const configs = [
        { name: 'Sick Leave', code: 'SICK', totalDays: 10 },
        { name: 'Casual Leave', code: 'CASUAL', totalDays: 10 },
        { name: 'Earned Leave', code: 'EARNED', totalDays: 15 },
    ];

    for (const c of configs) {
        const config = await prisma.leaveTypeConfig.upsert({
            where: { code_companyId: { code: c.code, companyId: company.id } },
            update: { totalDays: c.totalDays },
            create: {
                ...c,
                companyId: company.id,
            },
        });

        // 2. Create/Update Leave Balance for the employee
        await prisma.leaveBalance.upsert({
            where: {
                userId_leaveTypeId_year: {
                    userId: employee.id,
                    leaveTypeId: config.id,
                    year: 2026,
                },
            },
            update: {
                used: 5, // "add each 5 leave" -> setting used to 5
                total: c.totalDays,
            },
            create: {
                userId: employee.id,
                leaveTypeId: config.id,
                companyId: company.id,
                year: 2026,
                total: c.totalDays,
                used: 5,
                pending: 0,
            },
        });
    }

    console.log('✅ Leave balances updated for employee@hrms.com (5 days used for each)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
