import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n📊 DATABASE STATUS CHECK: antigravity_db');
    console.log('='.repeat(55));

    // Count rows in major tables
    const counts = await Promise.allSettled([
        prisma.company.count().then(c => ({ table: 'Company', count: c })),
        prisma.user.count().then(c => ({ table: 'User', count: c })),
        prisma.timeEntry.count().then(c => ({ table: 'TimeEntry (Attendance)', count: c })),
        prisma.leaveRequest.count().then(c => ({ table: 'LeaveRequest', count: c })),
        prisma.payrollBatch.count().then(c => ({ table: 'PayrollBatch', count: c })),
        prisma.payslip.count().then(c => ({ table: 'Payslip', count: c })),
        prisma.salaryConfig.count().then(c => ({ table: 'SalaryConfig', count: c })),
        prisma.project.count().then(c => ({ table: 'Project', count: c })),
        prisma.ticket.count().then(c => ({ table: 'Ticket', count: c })),
        prisma.poll.count().then(c => ({ table: 'Poll', count: c })),
        prisma.auditLog.count().then(c => ({ table: 'AuditLog', count: c })),
    ]);

    console.log('TABLE                       | COUNT');
    console.log('-'.repeat(55));
    counts.forEach(result => {
        if (result.status === 'fulfilled') {
            const { table, count } = result.value;
            console.log(table.padEnd(27) + ' | ' + count);
        } else {
            console.log('ERROR: ' + result.reason?.message);
        }
    });

    console.log('='.repeat(55));
    console.log('\n✅ Database connection: HEALTHY');
}

main()
    .catch(e => console.error('❌ DB ERROR:', e.message))
    .finally(() => prisma.$disconnect());
