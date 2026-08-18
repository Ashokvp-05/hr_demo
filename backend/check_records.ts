import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- COMPANIES ---');
    const companies = await prisma.company.findMany();
    console.log(companies);

    console.log('\n--- USERS ---');
    const users = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log(users.map(u => ({ id: u.id, email: u.email, name: u.name, status: u.status, companyId: u.companyId })));

    console.log('\n--- ROLES ---');
    const roles = await prisma.role.findMany({
        take: 5,
        orderBy: { companyId: 'desc' }
    });
    console.log(roles.map(r => ({ id: r.id, name: r.name, companyId: r.companyId })));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
