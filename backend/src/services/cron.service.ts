import cron from 'node-cron';
import prisma from '../config/db';
import { TimeEntryStatus, NotificationType } from '@prisma/client';
import * as emailService from './email.service';
import * as notificationService from './notification.service';
import * as timeEntryService from './timeEntry.service';

export const initCronJobs = () => {
    console.log('Initializing Cron Jobs...');

    // Rule: 7 PM Clock-Out Reminder
    cron.schedule('0 19 * * *', async () => {
        console.log('[CRON] Running 7 PM Clock-Out Check...');
        try {
            const companies = await (prisma.company as any).findMany({ where: { status: 'ACTIVE' } });
            for (const company of companies) {
                const activeEntries = await prisma.timeEntry.findMany({
                    where: { status: TimeEntryStatus.ACTIVE, companyId: company.id },
                    include: { user: true }
                });

                for (const entry of activeEntries) {
                    if (entry.user.email) {
                        await emailService.sendClockOutReminder(entry.user.email, entry.user.name || 'Employee');
                    }

                    await notificationService.createNotification({
                        userId: entry.userId,
                        companyId: company.id,
                        title: 'Clock Out Reminder',
                        message: 'It is 7:00 PM. Please remember to clock out if you have finished for the day.',
                        type: NotificationType.INFO,
                        actionData: { action: 'clock-out' }
                    });
                }
            }
        } catch (error) {
            console.error('[CRON] Error in 7 PM Check:', error);
        }
    });

    // Rule: Weekly Admin Summary Report
    cron.schedule('0 8 * * 1', async () => {
        console.log('[CRON] Generating Weekly Admin Reports...');
        try {
            const companies = await (prisma.company as any).findMany({ where: { status: 'ACTIVE' } });
            for (const company of companies) {
                const [totalUsers, totalHours, pendingLeaves, admins] = await Promise.all([
                    prisma.user.count({ where: { status: 'ACTIVE', companyId: company.id } }),
                    prisma.timeEntry.aggregate({
                        _sum: { hoursWorked: true },
                        where: { companyId: company.id }
                    }),
                    prisma.leaveRequest.count({ where: { status: 'PENDING', companyId: company.id } }),
                    prisma.user.findMany({
                        where: { role: { name: 'COMPANY_ADMIN', companyId: company.id } },
                        select: { email: true }
                    })
                ]);

                const stats = {
                    totalUsers,
                    totalHours: (totalHours._sum.hoursWorked as any) || 0,
                    pendingLeaves
                };

                for (const admin of admins) {
                    if (admin.email) {
                        await emailService.sendWeeklyReport(admin.email, stats);
                    }
                }
            }
        } catch (error) {
            console.error('[CRON] Error in Weekly Report:', error);
        }
    });

    // Rule 3.2: Payroll Processed Check (25th of month)
    cron.schedule('0 10 25 * *', async () => {
        console.log('[CRON] Checking Monthly Payroll Status...');
        const month = new Date().toLocaleString('default', { month: 'long' });
        const year = new Date().getFullYear();

        try {
            const companies = await (prisma.company as any).findMany({ where: { status: 'ACTIVE' } });
            for (const company of companies) {
                const payslipsCreated = await prisma.payslip.count({
                    where: { month, year, companyId: company.id }
                });

                if (payslipsCreated === 0) {
                    const alertTargets = await prisma.user.findMany({
                        where: {
                            companyId: company.id,
                            role: { name: { in: ['COMPANY_ADMIN', 'HR_MANAGER'] } }
                        }
                    });

                    for (const target of alertTargets) {
                        await notificationService.createNotification({
                            userId: target.id,
                            companyId: company.id,
                            title: '🚨 CRITICAL: Payroll Not Processed',
                            message: `Strategic Alert: Payroll generation for ${month} ${year} has not been initiated.`,
                            type: NotificationType.ALERT
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[CRON] Error in Payroll Check:', error);
        }
    });

    // Rule 3.3: Scheduled Task - Tax Investment Declarations
    cron.schedule('0 9 1 1,7 *', async () => {
        console.log('[CRON] Sending Tax Declaration Reminders...');
        try {
            const companies = await (prisma.company as any).findMany({ where: { status: 'ACTIVE' } });
            for (const company of companies) {
                const users = await prisma.user.findMany({ where: { status: 'ACTIVE', companyId: company.id } });
                for (const user of users) {
                    await notificationService.createNotification({
                        userId: user.id,
                        companyId: company.id,
                        title: '📋 Tax Declaration Window Open',
                        message: 'The investment declaration window is now open.',
                        type: NotificationType.INFO,
                        actionData: { action: 'tax-declaration' }
                    });
                }
            }
        } catch (error) {
            console.error('[CRON] Error in Tax Reminder:', error);
        }
    });

    // Rule 3.4: Escalation Logic (Every 12 hours)
    cron.schedule('0 */12 * * *', async () => {
        console.log('[CRON] Running Claim Escalation Logic...');
        const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000);

        try {
            const companies = await (prisma.company as any).findMany({ where: { status: 'ACTIVE' } });
            for (const company of companies) {
                const stagnantSteps = await (prisma.approvalStep as any).findMany({
                    where: {
                        status: 'PENDING',
                        createdAt: { lt: threshold },
                        approver: { companyId: company.id }
                    },
                    include: { approver: true }
                });

                for (const step of stagnantSteps) {
                    const hrManagers = await prisma.user.findMany({
                        where: {
                            companyId: company.id,
                            role: { name: 'HR_MANAGER' }
                        }
                    });

                    for (const hr of hrManagers) {
                        await notificationService.createNotification({
                            userId: hr.id,
                            companyId: company.id,
                            title: '⚡ ESCALATION: Pending Claim Stagnant',
                            message: `Claim has been pending for > 48 hours.`,
                            type: NotificationType.WARNING
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[CRON] Error in Escalation logic:', error);
        }
    });

    // New Rule: End of Day Attendance Analysis (11:55 PM)
    cron.schedule('55 23 * * *', async () => {
        console.log('[CRON] Running End of Day Attendance Analysis...');
        try {
            const companies = await (prisma.company as any).findMany({ where: { status: 'ACTIVE' } });
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            for (const company of companies) {
                const entries = await prisma.timeEntry.findMany({
                    where: {
                        companyId: company.id,
                        clockIn: { gte: today, lt: tomorrow }
                    },
                    include: { user: true }
                });

                let lateCount = 0;
                let ghostCount = 0; // Forgot to clock out
                let totalHours = 0;
                const userSummaries: string[] = [];

                for (const entry of entries) {
                    const clockInTime = new Date(entry.clockIn);
                    const isLate = clockInTime.getHours() > 9 || (clockInTime.getHours() === 9 && clockInTime.getMinutes() > 30);
                    if (isLate) lateCount++;

                    if (entry.status === TimeEntryStatus.ACTIVE) {
                        ghostCount++;
                    } else if (entry.hoursWorked) {
                        totalHours += Number(entry.hoursWorked);
                    }

                    userSummaries.push(`${entry.user.name}: ${clockInTime.toLocaleTimeString()} - ${entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : 'STILL ACTIVE'} (${entry.hoursWorked || 0}h)`);
                }

                if (entries.length > 0) {
                    const admins = await prisma.user.findMany({
                        where: {
                            companyId: company.id,
                            role: { name: { in: ['COMPANY_ADMIN', 'HR_MANAGER', 'ADMIN', 'AUDITOR'] } }
                        }
                    });

                    const stats = {
                        date: today.toLocaleDateString(),
                        totalEntries: entries.length,
                        lateCount,
                        ghostCount,
                        totalHours: totalHours.toFixed(2),
                        summaries: userSummaries
                    };

                    for (const admin of admins) {
                        // In-app notification
                        await notificationService.createNotification({
                            userId: admin.id,
                            companyId: company.id,
                            title: '📊 Daily Attendance Analysis',
                            message: `Today's Summary: ${entries.length} present, ${lateCount} late, ${ghostCount} missing clock-outs. Total: ${totalHours.toFixed(1)}h.`,
                            type: NotificationType.INFO
                        });

                        // Email notification
                        if (admin.email) {
                            await emailService.sendDailyAttendanceReport(admin.email, stats);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[CRON] Error in EOD Analysis:', error);
        }
    });

    // New Rule: Monthly Corporate Overall Report (1st of every month at 00:05 AM)
    cron.schedule('5 0 1 * *', async () => {
        console.log('[CRON] Generating Monthly Overall Reports...');
        try {
            const companies = await (prisma.company as any).findMany({ where: { status: 'ACTIVE' } });
            
            // Calculate previous month boundaries
            const now = new Date();
            const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            
            const prevMonthName = firstDayOfPrevMonth.toLocaleString('default', { month: 'long' });
            const prevMonthYear = firstDayOfPrevMonth.getFullYear();

            for (const company of companies) {
                const [totalUsers, totalHoursResult, approvedLeaves, payslips] = await Promise.all([
                    prisma.user.count({ where: { status: 'ACTIVE', companyId: company.id } }),
                    prisma.timeEntry.aggregate({
                        _sum: { hoursWorked: true },
                        where: { 
                            companyId: company.id,
                            clockIn: { gte: firstDayOfPrevMonth, lt: firstDayOfCurrentMonth }
                        }
                    }),
                    prisma.leaveRequest.count({ 
                        where: { 
                            status: 'APPROVED', 
                            companyId: company.id,
                            startDate: { gte: firstDayOfPrevMonth, lt: firstDayOfCurrentMonth }
                        } 
                    }),
                    prisma.payslip.count({ 
                        where: { 
                            companyId: company.id,
                            month: prevMonthName,
                            year: prevMonthYear
                        } 
                    })
                ]);

                const stats = {
                    month: prevMonthName,
                    year: prevMonthYear,
                    totalUsers,
                    totalHours: (totalHoursResult._sum.hoursWorked as any) || 0,
                    approvedLeaves,
                    payslips
                };

                const superAdmins = await prisma.user.findMany({
                    where: { role: { name: 'SUPER_ADMIN' }, companyId: company.id },
                    select: { email: true, id: true }
                });

                for (const admin of superAdmins) {
                    if (admin.email) {
                        await emailService.sendMonthlyReport(admin.email, stats).catch(e => console.error("Monthly email error:", e));
                    }
                    
                    await notificationService.createNotification({
                        userId: admin.id,
                        companyId: company.id,
                        title: `📈 ${prevMonthName} Corporate Summary`,
                        message: `The corporate overview for ${prevMonthName} is ready. Total Hours Logged: ${stats.totalHours}h, Approved Leaves: ${stats.approvedLeaves}.`,
                        type: NotificationType.INFO
                    });
                }
            }
        } catch (error) {
            console.error('[CRON] Error in Monthly Overall Report:', error);
        }
    });

    // Rule: Ghost Session Cleanup (Auto Clock-Out - Hourly)
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Cleaning up ghost attendance sessions...');
        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

        try {
            // 1. Identify active sessions
            const activeEntries = await prisma.timeEntry.findMany({
                where: { status: 'ACTIVE' },
                include: { user: { include: { shiftAssignments: { include: { shift: true }, where: { endDate: null } } } } }
            });

            for (const entry of activeEntries) {
                let shouldAutoClockOut = false;
                let autoClockOutTime = now;

                // Case A: Hard timeout (12 hours)
                if (new Date(entry.clockIn) < twelveHoursAgo) {
                    shouldAutoClockOut = true;
                }

                // Case B: Shift-based timeout (Shift End + 1 Hour)
                const assignment = entry.user.shiftAssignments[0];
                if (assignment?.shift) {
                    const [endH, endM] = assignment.shift.endTime.split(':').map(Number);
                    const shiftEndToday = new Date(now);
                    shiftEndToday.setHours(endH, endM, 0, 0);

                    const cutoff = new Date(shiftEndToday.getTime() + 60 * 60 * 1000); // 1 hour buffer

                    if (now > cutoff && new Date(entry.clockIn) < shiftEndToday) {
                        shouldAutoClockOut = true;
                        autoClockOutTime = cutoff; // Clock out at shift end + 1hr
                    }
                }

                if (shouldAutoClockOut) {
                    console.log(`[CRON] Auto clock-out for user ${entry.userId} (forgotten session)`);
                    
                    await timeEntryService.clockOut(entry.userId, entry.companyId!, autoClockOutTime);

                    await notificationService.createNotification({
                        userId: entry.userId,
                        companyId: entry.companyId!,
                        title: '🕒 Automatic Clock-Out',
                        message: `Systemic closure: You were automatically clocked out because the session exceeded its limits. Final log recorded at ${autoClockOutTime.toLocaleTimeString()}.`,
                        type: NotificationType.WARNING,
                        actionData: { action: 'view-history' }
                    });
                }
            }
        } catch (error) {
            console.error('[CRON] Error in Ghost Cleanup:', error);
        }
    });
};

