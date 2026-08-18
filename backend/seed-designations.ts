import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.findFirst();
    if (!company) { 
        console.log("No company found"); 
        return; 
    }
    
    await prisma.designation.createMany({
        data: [
            { name: "Software Engineer", companyId: company.id },
            { name: "Product Manager", companyId: company.id },
            { name: "HR Specialist", companyId: company.id },
            { name: "Sales Executive", companyId: company.id },
            { name: "Support Engineer", companyId: company.id },
            { name: "QA Analyst", companyId: company.id }
        ],
        skipDuplicates: true
    });
    console.log("Successfully seeded job titles (designations)!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
