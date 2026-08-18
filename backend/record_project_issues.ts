import { PrismaClient, TicketPriority, TicketCategory, TicketStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📝 Recording project issues into Company Audit Logs and Support Tickets...');

    // 1. Find the default company
    const company = await prisma.company.findUnique({
        where: { subdomain: 'default' }
    });

    if (!company) {
        console.error('❌ Error: Default company not found.');
        return;
    }

    // 2. Find the superadmin user to attribute the logs to
    const superAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@hrms.com' }
    });

    if (!superAdmin) {
        console.error('❌ Error: Super Admin user not found.');
        return;
    }

    const issues = [
        {
            title: 'Docker Connection Failure',
            details: 'Docker Desktop API (npipe) was inaccessible during initial startup. This prevented the containerized database from spinning up automatically.',
            category: 'INFRASTRUCTURE_FAILURE' as const
        },
        {
            title: 'Frontend Environment Runtime Error',
            details: 'The Next.js dev server encountered exit code 1 on first boot. Required manual intervention via `npx next dev` with increased wait time to stabilize the Turbopack build.',
            category: 'UI_RUNTIME_ERROR' as const
        },
        {
            title: 'Database Verification Task Failure',
            details: 'The `check_db.ts` diagnostics script failed to execute properly due to initial connection handshake issues during schema synchronization.',
            category: 'DATABASE_SYNC_FAILURE' as const
        }
    ];

    // 3. Create Audit Logs
    console.log('✅ Creating Audit Logs...');
    for (const issue of issues) {
        await prisma.auditLog.create({
            data: {
                action: issue.category,
                details: `[INITIAL_SETUP_ISSUE] ${issue.title}: ${issue.details}`,
                adminId: superAdmin.id,
                companyId: company.id,
                targetId: superAdmin.id // Recorded against the system itself
            }
        });
    }

    // 4. Create Support Tickets
    console.log('✅ Creating Support Tickets...');
    for (const issue of issues) {
        await prisma.ticket.create({
            data: {
                userId: superAdmin.id,
                companyId: company.id,
                title: issue.title,
                description: issue.details,
                priority: 'HIGH',
                category: 'BUG',
                status: 'RESOLVED', // Mark them as resolved since we fixed them
                module: 'Infrastructure'
            }
        });
    }

    console.log('✨ Success! These issues are now part of the \"Default Company\" official record.');
    console.log('📊 You can view them in:');
    console.log('   - Admin Dashboard > Audit Logs');
    console.log('   - Support/Tickets section');
}

main()
    .catch(e => console.error('❌ Error:', e))
    .finally(() => prisma.$disconnect());
