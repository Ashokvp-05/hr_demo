import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.role.findMany({ where: { companyId: '6c4da70d-9c6d-4675-9d10-71d1204623c4' } })
    .then(r => console.log('Roles for UI Trigger Corp:', r))
    .finally(() => prisma.$disconnect());
