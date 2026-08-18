
import prisma from '../config/db';
import cache from '../config/cache';
import * as timeService from './timeEntry.service';
import * as leaveService from './leave.service';
import * as payslipService from './payslip.service';
import { startOfMonth, format, differenceInBusinessDays } from 'date-fns';

export const getEmployeeDashboardData = async (userId: string, companyId: string) => {
    const cacheKey = `dashboard_data_${userId}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        return cachedData;
    }

    const todayDate = new Date();
    const todayIso = format(todayDate, 'yyyy-MM-dd');

    // Fetch all data in parallel
    const monthStart = startOfMonth(todayDate);
    const monthEnd = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0, 23, 59, 59, 999);

    let summary = { totalHours: "0.00", daysWorked: 0, overtimeHours: "0", regularHours: "0", lateCheckIns: 0, totalWeekDays: 5, chartData: [] };
    let leaveBalances: any[] = [];
    let payslips: any[] = [];
    let calendar: any[] = [];
    let activeEntry: any = null;
    let announcements: any[] = [];
    let monthlyEntries: any[] = [];

    try {
        const results = await Promise.all([
            timeService.getSummary(userId, companyId).catch((e) => { console.error("Dashboard summary err:", e); return summary; }),
            (prisma as any).leaveBalance.findMany({
                where: { userId, companyId, year: todayDate.getFullYear() },
                include: { leaveTypeConfig: true }
            }).catch((e: any) => []),
            payslipService.getMyPayslips(userId, companyId).catch((e) => []),
            prisma.holiday.findMany({
                where: { companyId, date: { gte: monthStart, lte: todayDate } }
            }).catch((e) => []),
            timeService.getActiveEntry(userId, companyId).catch((e) => { console.error("Dashboard getActiveEntry error:", e); return null; }),
            prisma.announcement.findMany({
                where: { companyId, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
                orderBy: { createdAt: 'desc' },
                take: 5
            }).catch((e) => []),
            prisma.timeEntry.findMany({
                where: { userId, companyId, clockIn: { gte: monthStart, lte: monthEnd }, status: { in: ['COMPLETED', 'ACTIVE'] } }
            }).catch((e) => [])
        ]);

        summary = results[0] as any;
        leaveBalances = results[1] as any;
        payslips = results[2] as any;
        calendar = results[3] as any;
        activeEntry = results[4] as any;
        announcements = results[5] as any;
        monthlyEntries = results[6] as any;
    } catch (e) {
        console.error("Dashboard fetch error:", e);
    }

    // Compute monthly summary (safe — uses local data only)
    const monthlyDaysSet = new Set<string>();
    let monthlyTotalHours = 0;
    let monthlyLateCheckIns = 0;
    try {
        monthlyEntries.forEach((entry: any) => {
            const dayKey = entry.clockIn.toISOString().split('T')[0];
            monthlyDaysSet.add(dayKey);
            monthlyTotalHours += entry.hoursWorked ? Number(entry.hoursWorked) : 0;
            const cHour = entry.clockIn.getHours();
            const cMin = entry.clockIn.getMinutes();
            if (cHour > 9 || (cHour === 9 && cMin > 30)) monthlyLateCheckIns++;
        });
    } catch (e) {
        console.error("Monthly summary computation error:", e);
    }

    // Business days in month (Mon-Fri)
    let monthlyBusinessDays = 0;
    const tmpDate = new Date(monthStart);
    while (tmpDate <= monthEnd) {
        const dow = tmpDate.getDay();
        if (dow !== 0 && dow !== 6) monthlyBusinessDays++;
        tmpDate.setDate(tmpDate.getDate() + 1);
    }
    const monthlySummary = {
        present: monthlyDaysSet.size,
        businessDays: monthlyBusinessDays,
        totalHours: monthlyTotalHours.toFixed(2),
        lateCheckIns: monthlyLateCheckIns,
        ratio: monthlyBusinessDays > 0 ? Math.round((monthlyDaysSet.size / monthlyBusinessDays) * 100) : 0,
        monthName: format(todayDate, 'MMMM'),
        year: todayDate.getFullYear()
    };

    // Yearly month-by-month breakdown — wrapped in try/catch for resilience
    let yearlySummary: any = {
        months: [],
        totalPresent: 0,
        totalBusinessDays: 0,
        year: todayDate.getFullYear()
    };

    try {
        const yearStart = new Date(todayDate.getFullYear(), 0, 1);
        const yearEnd = new Date(todayDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        const yearlyEntries = await prisma.timeEntry.findMany({
            where: {
                userId,
                companyId,
                clockIn: { gte: yearStart, lte: yearEnd },
                status: { in: ['COMPLETED', 'ACTIVE'] }
            }
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const yearlyMonths = monthNames.map((name, idx) => {
            const mStart = new Date(todayDate.getFullYear(), idx, 1);
            const mEnd = new Date(todayDate.getFullYear(), idx + 1, 0);
            // Business days for this month
            let bDays = 0;
            const t = new Date(mStart);
            while (t <= mEnd) {
                const d = t.getDay();
                if (d !== 0 && d !== 6) bDays++;
                t.setDate(t.getDate() + 1);
            }
            // Present days for this month
            const daysSet = new Set<string>();
            yearlyEntries.forEach((entry: any) => {
                const entryMonth = entry.clockIn.getMonth();
                if (entryMonth === idx) {
                    daysSet.add(entry.clockIn.toISOString().split('T')[0]);
                }
            });
            return { month: name, present: daysSet.size, businessDays: bDays };
        });

        // Only include months up to current month
        const currentMonthIdx = todayDate.getMonth();
        yearlySummary = {
            months: yearlyMonths.slice(0, currentMonthIdx + 1),
            totalPresent: yearlyMonths.slice(0, currentMonthIdx + 1).reduce((a, m) => a + m.present, 0),
            totalBusinessDays: yearlyMonths.slice(0, currentMonthIdx + 1).reduce((a, m) => a + m.businessDays, 0),
            year: todayDate.getFullYear()
        };
    } catch (e) {
        console.error("Yearly summary computation error:", e);
    }

    // Payslip extraction — wrapped in try/catch for resilience
    let latestPayslip = null;
    try {
        if (Array.isArray(payslips) && payslips.length > 0) {
            const sorted = [...payslips].sort((a: any, b: any) =>
                (b.year - a.year) || (new Date(`${b.month} 1`).getTime() - new Date(`${a.month} 1`).getTime())
            );
            const latest = sorted[0];
            latestPayslip = {
                ...latest,
                amount: Number(latest.netSalary || 0)
            };
        }
    } catch (e) {
        console.error("Payslip extraction error:", e);
    }

    const data = {
        summary,
        monthlySummary,
        yearlySummary,
        leaveBalances,
        latestPayslip,
        calendar,
        activeEntry,
        announcements,
        timestamp: new Date()
    };

    // Cache for 2 seconds for real-time responsiveness
    cache.set(cacheKey, data, 2);

    return data;
};

export const getAdminStats = async (companyId: string) => {
    const cacheKey = `admin_dashboard_stats_${companyId}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) return cachedData;

    const [userCount, activeCheckins, pendingLeaves, openTickets, deptCount, desigCount, branchCount] = await Promise.all([
        prisma.user.count({ where: { companyId } }),
        prisma.timeEntry.count({ where: { companyId, status: 'ACTIVE' } }),
        prisma.leaveRequest.count({ where: { companyId, status: 'PENDING' } }),
        prisma.ticket.count({ where: { companyId, status: 'OPEN' } }),
        (prisma as any).department.count({ where: { companyId } }),
        (prisma as any).designation.count({ where: { companyId } }),
        (prisma as any).branch.count({ where: { companyId } })
    ]);

    const stats = {
        userCount,
        activeCheckins,
        pendingLeaves,
        openTickets,
        deptCount,
        desigCount,
        branchCount,
        lastUpdated: new Date()
    };

    cache.set(cacheKey, stats, 60); // Cache for 1 minute
    return stats;
};

export const getManagerDashboardData = async (managerId: string, companyId: string) => {
    const cacheKey = `manager_dashboard_${managerId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const [teamCount, pendingLeaves, activeTeam] = await Promise.all([
        prisma.user.count({
            where: { managerId, companyId }
        }),
        prisma.leaveRequest.findMany({
            where: {
                companyId,
                status: 'PENDING',
                user: { managerId }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.timeEntry.findMany({
            where: {
                companyId,
                status: 'ACTIVE',
                user: { managerId }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        department: { select: { name: true } }
                    }
                }
            }
        })
    ]);

    const data = {
        teamCount,
        pendingLeaves,
        activeTeamCount: activeTeam.length,
        activeTeam: activeTeam.map(entry => ({
            id: entry.user.id,
            name: entry.user.name,
            avatar: entry.user.avatarUrl,
            department: (entry.user.department as any)?.name || 'General',
            clockIn: entry.clockIn,
            location: (entry.location as any)?.name || 'Office HQ',
            status: 'ONLINE'
        })),
        lastUpdated: new Date()
    };

    cache.set(cacheKey, data, 60);
    return data;
};

export const getManagerPerformance = async (managerId: string, companyId: string) => {
    const teamMembers = await prisma.user.findMany({
        where: { managerId, companyId },
        select: { name: true }
    });

    const names = teamMembers.map(u => u.name);

    return [
        {
            id: 1,
            subject: 'Delivery Velocity',
            score: 92,
            target: 85,
            trend: '+4.5%',
            history: [60, 65, 75, 80, 85, 92],
            status: 'Excellent',
            statusColor: 'text-emerald-600',
            barColor: 'bg-emerald-500',
            lineColor: '#10b981',
            impactingUsers: names.slice(0, 3),
            forecast: "Projected to hit 94% next sprint based on current velocity.",
            drivers: ["Efficiency is above average", "Backend migration completed early"]
        },
        {
            id: 2,
            subject: 'Code Quality',
            score: 88,
            target: 80,
            trend: '+1.2%',
            history: [82, 81, 83, 85, 86, 88],
            status: 'Stable',
            statusColor: 'text-indigo-600',
            barColor: 'bg-indigo-500',
            lineColor: '#6366f1',
            impactingUsers: names.slice(1, 4),
            forecast: "Maintaining stability. Minor debt reduction expected.",
            drivers: ["Automated testing coverage increased", "Code review turnaround is steady"]
        },
        {
            id: 3,
            subject: 'Team Availability',
            score: 95,
            target: 90,
            trend: '+0.5%',
            history: [90, 91, 90, 92, 94, 95],
            status: 'High',
            statusColor: 'text-emerald-600',
            barColor: 'bg-emerald-500',
            lineColor: '#10b981',
            impactingUsers: [],
            forecast: "Dip expected next week due to planned PTOs.",
            drivers: ["Fully staffed this week", "No sick leaves reported"]
        },
        {
            id: 4,
            subject: 'Burnout Risk',
            score: 35,
            target: 20,
            trend: '+5%',
            history: [15, 18, 22, 28, 30, 35],
            status: 'Low',
            statusColor: 'text-indigo-600',
            barColor: 'bg-indigo-500',
            lineColor: '#6366f1',
            impactingUsers: names.slice(-2),
            forecast: "Safe levels maintained.",
            drivers: ["Reduced overtime this week", "Weekend workloads are minimal"]
        },
    ];
};

export const getManagerProductivity = async (managerId: string, companyId: string) => {
    return {
        efficiency: 8.2,
        metrics: [
            { label: "Consistency", value: 87, color: "bg-emerald-500", glow: "shadow-emerald-500/20" },
            { label: "Intensity", value: 72, color: "bg-amber-500", glow: "shadow-amber-500/20" },
            { label: "Focus", value: 94, color: "bg-indigo-500", glow: "shadow-indigo-500/20" },
            { label: "Stability", value: 81, color: "bg-blue-500", glow: "shadow-blue-500/20" },
        ],
        trend: '+15% Yield',
        status: 'Optimal Flow'
    };
};
