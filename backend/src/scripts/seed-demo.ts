/**
 * Demo Seed Script — seeds realistic HR data for demo visitors.
 * Run via: POST /api/demo/reset?secret=<ADMIN_APPROVE_SECRET>
 * Or directly: npx ts-node src/scripts/seed-demo.ts
 */
import prisma from '../config/db';
import bcrypt from 'bcryptjs';

const DEMO_COMPANY_NAME = 'Rudratic Technologies';

const DEPARTMENTS = ['Engineering', 'Human Resources', 'Finance', 'Operations'];

const DESIGNATIONS = [
    'Software Engineer', 'Senior Software Engineer', 'Tech Lead',
    'HR Manager', 'HR Executive', 'Finance Analyst', 'Finance Manager',
    'Operations Manager', 'Operations Executive', 'Product Manager',
];

const DEMO_EMPLOYEES = [
    { name: 'Arjun Mehta',    email: 'arjun.mehta@rudratic.com',    dept: 'Engineering',     desig: 'Tech Lead',               roleName: 'COMPANY_ADMIN' },
    { name: 'Priya Sharma',   email: 'priya.sharma@rudratic.com',   dept: 'Engineering',     desig: 'Senior Software Engineer', roleName: 'EMPLOYEE' },
    { name: 'Karan Singh',    email: 'karan.singh@rudratic.com',    dept: 'Engineering',     desig: 'Software Engineer',        roleName: 'EMPLOYEE' },
    { name: 'Sneha Patel',    email: 'sneha.patel@rudratic.com',    dept: 'Engineering',     desig: 'Software Engineer',        roleName: 'EMPLOYEE' },
    { name: 'Rahul Verma',    email: 'rahul.verma@rudratic.com',    dept: 'Human Resources', desig: 'HR Manager',               roleName: 'HR_ADMIN' },
    { name: 'Neha Kapoor',    email: 'neha.kapoor@rudratic.com',    dept: 'Human Resources', desig: 'HR Executive',             roleName: 'EMPLOYEE' },
    { name: 'Ananya Iyer',    email: 'ananya.iyer@rudratic.com',    dept: 'Finance',         desig: 'Finance Manager',          roleName: 'FINANCE_ADMIN' },
    { name: 'Vikram Nair',    email: 'vikram.nair@rudratic.com',    dept: 'Finance',         desig: 'Finance Analyst',          roleName: 'EMPLOYEE' },
    { name: 'Divya Krishnan', email: 'divya.krishnan@rudratic.com', dept: 'Operations',      desig: 'Operations Manager',       roleName: 'EMPLOYEE' },
    { name: 'Rohan Gupta',    email: 'rohan.gupta@rudratic.com',    dept: 'Operations',      desig: 'Operations Executive',     roleName: 'EMPLOYEE' },
    { name: 'Meera Joshi',    email: 'meera.joshi@rudratic.com',    dept: 'Engineering',     desig: 'Product Manager',          roleName: 'EMPLOYEE' },
    { name: 'Aditya Rao',     email: 'aditya.rao@rudratic.com',     dept: 'Engineering',     desig: 'Software Engineer',        roleName: 'EMPLOYEE' },
];

const ANNOUNCEMENTS = [
    {
        title: '🎉 Q3 All-Hands Meeting — August 15th',
        content: 'Join us for our quarterly all-hands on August 15th at 3 PM IST. Agenda includes product roadmap, team shoutouts, and Q&A with leadership. Zoom link will be shared 24 hours before.',
    },
    {
        title: '🏖️ Diwali Holiday Notice',
        content: 'The office will be closed from October 28–31 for Diwali. Please plan your deliverables accordingly. Wishing everyone a happy and prosperous Diwali!',
    },
    {
        title: '📋 New WFH Policy Effective September 1',
        content: 'Starting September 1, employees may work from home up to 2 days per week. Please coordinate with your managers and ensure your remote setup meets security guidelines.',
    },
];

const KUDOS_MESSAGES = [
    { msg: 'Amazing work on the Q2 release! Shipped on time despite tight deadlines. 🚀', cat: 'Teamwork' },
    { msg: 'Thank you for staying late to help debug the production issue. True team player! 💪', cat: 'Going Beyond' },
    { msg: 'Your presentation to the client was outstanding. Really represented us well! 🌟', cat: 'Excellence' },
    { msg: 'Incredible patience in onboarding the new joiners this month. Much appreciated! 🙏', cat: 'Mentorship' },
    { msg: 'Great job automating the payroll reports — saved us hours every week! ⚡', cat: 'Innovation' },
];

const SALARY_BANDS: Record<string, number> = {
    'Tech Lead': 180000, 'Senior Software Engineer': 140000, 'Software Engineer': 100000,
    'Product Manager': 150000, 'HR Manager': 120000, 'HR Executive': 80000,
    'Finance Manager': 130000, 'Finance Analyst': 90000, 'Operations Manager': 110000,
    'Operations Executive': 75000,
};

export async function seedDemoData() {
    console.log('[SEED] Starting demo data seed...');

    // ── 1. Ensure Company ──────────────────────────────────────────────
    let company = await prisma.company.findFirst({ where: { name: DEMO_COMPANY_NAME } });
    if (!company) company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: { name: DEMO_COMPANY_NAME, subdomain: 'rudratic', domain: 'rudratic.com', status: 'ACTIVE' }
        });
    }
    const companyId = company.id;
    console.log(`[SEED] Company: ${company.name} (${companyId})`);

    // ── Clear existing transactional data for a clean reset ────────────────
    console.log('[SEED] Purging existing transactional records for a clean reset...');
    await prisma.kudos.deleteMany({ where: { companyId } });
    await prisma.announcement.deleteMany({ where: { companyId } });
    await prisma.leaveRequest.deleteMany({ where: { companyId } });
    await prisma.timeEntry.deleteMany({ where: { companyId } });
    await prisma.payslip.deleteMany({ where: { companyId } });


    // ── 2. Departments ─────────────────────────────────────────────────
    const deptMap: Record<string, string> = {};
    for (const deptName of DEPARTMENTS) {
        const dept = await prisma.department.upsert({
            where: { name_companyId: { name: deptName, companyId } },
            update: {},
            create: { name: deptName, companyId }
        });
        deptMap[deptName] = dept.id;
    }

    // ── 3. Designations ────────────────────────────────────────────────
    const desigMap: Record<string, string> = {};
    for (const desigName of DESIGNATIONS) {
        const desig = await prisma.designation.upsert({
            where: { name_companyId: { name: desigName, companyId } },
            update: {},
            create: { name: desigName, companyId }
        });
        desigMap[desigName] = desig.id;
    }

    // ── 4. Roles ───────────────────────────────────────────────────────
    const roleNames = ['COMPANY_ADMIN', 'EMPLOYEE', 'HR_ADMIN', 'FINANCE_ADMIN'];
    const roleMap: Record<string, string> = {};
    for (const roleName of roleNames) {
        const role = await prisma.role.upsert({
            where: { name_companyId: { name: roleName, companyId } },
            update: {},
            create: {
                name: roleName, companyId,
                permissions: {
                    manage_employees: roleName !== 'EMPLOYEE',
                    view_reports: true, apply_leave: true, view_payslips: true, clock_in_out: true,
                    manage_settings: roleName === 'COMPANY_ADMIN',
                    approve_leaves: roleName !== 'EMPLOYEE',
                } as any
            }
        });
        roleMap[roleName] = role.id;
    }

    // ── 5. Users ───────────────────────────────────────────────────────
    const dummyPassword = await bcrypt.hash('Demo@12345', 10);
    const userMap: Record<string, string> = {};

    for (const emp of DEMO_EMPLOYEES) {
        const roleId = roleMap[emp.roleName] || roleMap['EMPLOYEE'];
        const user = await prisma.user.upsert({
            where: { email: emp.email },
            update: {
                name: emp.name, roleId,
                deptId: deptMap[emp.dept],
                designationId: desigMap[emp.desig]
            },
            create: {
                email: emp.email, name: emp.name, password: dummyPassword,
                status: 'ACTIVE', emailVerified: true,
                companyId, roleId,
                deptId: deptMap[emp.dept],
                designationId: desigMap[emp.desig],
            }
        });
        userMap[emp.email] = user.id;
    }
    console.log(`[SEED] Users: ${Object.keys(userMap).length}`);

    // ── 6. Attendance / TimeEntry (last 30 days) ───────────────────────
    const today = new Date();
    let attendanceCount = 0;
    for (const emp of DEMO_EMPLOYEES) {
        const userId = userMap[emp.email];
        for (let d = 29; d >= 0; d--) {
            const date = new Date(today);
            date.setDate(today.getDate() - d);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            if (Math.random() < 0.1) continue; // 90% attendance

            const clockIn = new Date(date);
            clockIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);
            const clockOut = new Date(date);
            clockOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);

            const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
            const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);

            const existing = await prisma.timeEntry.findFirst({
                where: { userId, clockIn: { gte: dayStart, lte: dayEnd } }
            });
            if (!existing) {
                await prisma.timeEntry.create({
                    data: {
                        userId, companyId,
                        clockIn, clockOut,
                        clockType: 'IN_OFFICE',
                        status: 'COMPLETED',
                        hoursWorked: ((clockOut.getTime() - clockIn.getTime()) / 3600000).toFixed(2) as any,
                    }
                });
                attendanceCount++;
            }
        }
    }
    console.log(`[SEED] Attendance records: ${attendanceCount}`);

    // ── 7. Leave Requests ──────────────────────────────────────────────
    const leaveTypes: ('SICK' | 'CASUAL' | 'EARNED')[] = ['SICK', 'CASUAL', 'EARNED'];
    const leaveStatuses: ('PENDING' | 'APPROVED' | 'REJECTED')[] = ['PENDING', 'APPROVED', 'APPROVED', 'APPROVED', 'REJECTED'];
    let leaveCount = 0;

    for (const emp of DEMO_EMPLOYEES.slice(0, 9)) {
        const userId = userMap[emp.email];
        const numLeaves = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numLeaves; i++) {
            const daysBack = Math.floor(Math.random() * 60);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3));

            await prisma.leaveRequest.create({
                data: {
                    userId, companyId,
                    type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
                    reason: 'Personal reasons',
                    startDate, endDate,
                    status: leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)],
                }
            });
            leaveCount++;
        }
    }
    console.log(`[SEED] Leave requests: ${leaveCount}`);

    // ── 8. Payslips (last 3 months) ────────────────────────────────────
    let payslipCount = 0;
    for (const emp of DEMO_EMPLOYEES) {
        const userId = userMap[emp.email];
        const gross = SALARY_BANDS[emp.desig] || 90000;
        for (let m = 0; m < 3; m++) {
            const date = new Date();
            date.setMonth(date.getMonth() - m - 1);
            const month = date.toLocaleString('en-IN', { month: 'long' });
            const year = date.getFullYear();
            const hra = Math.round(gross * 0.4);
            const pf = Math.round(gross * 0.12);
            const tax = Math.round(gross * 0.1);
            const total = gross + hra;
            const deductions = pf + tax;

            const existing = await prisma.payslip.findFirst({ where: { userId, month, year } });
            if (!existing) {
                await prisma.payslip.create({
                    data: {
                        userId, companyId, month, year,
                        basicSalary: gross, hra,
                        grossSalary: total,
                        pfDeduction: pf,
                        taxDeduction: tax,
                        totalDeductions: deductions,
                        netSalary: total - deductions,
                        status: 'RELEASED',
                    }
                });
                payslipCount++;
            }
        }
    }
    console.log(`[SEED] Payslips: ${payslipCount}`);

    // ── 9. Kudos ────────────────────────────────────────────────────────
    const userIds = Object.values(userMap);
    let kudosCount = 0;
    for (let i = 0; i < KUDOS_MESSAGES.length; i++) {
        const fromUserId = userIds[i % userIds.length];
        const toUserId = userIds[(i + 2) % userIds.length];
        if (fromUserId === toUserId) continue;
        await prisma.kudos.create({
            data: { fromUserId, toUserId, companyId, message: KUDOS_MESSAGES[i].msg, category: KUDOS_MESSAGES[i].cat }
        });
        kudosCount++;
    }
    console.log(`[SEED] Kudos: ${kudosCount}`);

    // ── 10. Announcements ───────────────────────────────────────────────
    const adminUserId = userMap[DEMO_EMPLOYEES[0].email];
    let announcementCount = 0;
    for (const ann of ANNOUNCEMENTS) {
        const existing = await prisma.announcement.findFirst({ where: { title: ann.title, companyId } });
        if (!existing) {
            await prisma.announcement.create({
                data: { title: ann.title, content: ann.content, companyId, createdBy: adminUserId }
            });
            announcementCount++;
        }
    }
    console.log(`[SEED] Announcements: ${announcementCount}`);

    console.log('[SEED] ✅ Demo data seed complete!');
    return {
        company: company.name,
        employees: Object.keys(userMap).length,
        attendanceRecords: attendanceCount,
        leaveRequests: leaveCount,
        payslips: payslipCount,
        kudos: kudosCount,
        announcements: announcementCount,
    };
}

// Direct execution
if (require.main === module) {
    seedDemoData()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
