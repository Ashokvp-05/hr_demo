import prisma from '../config/db';
import bcrypt from 'bcryptjs';

declare const process: any;
import { UserStatus } from '@prisma/client';
import { SEEDED_SYSTEM_EMAILS } from '../config/seeded-accounts';
import cache from '../config/cache';

export const getPendingUsers = async (companyId: string) => {
    return prisma.user.findMany({
        where: { status: UserStatus.PENDING, companyId },
        select: { id: true, email: true, name: true, createdAt: true },
    });
};

// Helper to log admin actions
async function logAdminAction(action: string, adminId: string | undefined, companyId: string, targetId: string, details?: string) {
    if (!adminId) return;
    try {
        await (prisma as any).auditLog.create({
            data: {
                action,
                adminId,
                companyId,
                targetId,
                details
            }
        });
    } catch (e) {
        console.error("Failed to log audit action", e);
    }
}

export const approveUser = async (userId: string, companyId: string, adminId?: string) => {
    const user = await prisma.user.update({
        where: { id: userId, companyId },
        data: { status: UserStatus.ACTIVE },
    });

    await logAdminAction('USER_APPROVE', adminId, companyId, userId, `Approved user ${user.email}`);
    return user;
};

export const rejectUser = async (userId: string, companyId: string, adminId?: string) => {
    const user = await prisma.user.update({
        where: { id: userId, companyId },
        data: { status: UserStatus.SUSPENDED },
    });

    await logAdminAction('USER_REJECT', adminId, companyId, userId, `Rejected user ${user.email}`);
    return user;
};

export const getDatabaseStats = async (companyId: string) => {
    const [users, timeEntries, leaves, holidays, notifications, roles, depts] = await Promise.all([
        prisma.user.count({ where: { companyId } }),
        prisma.timeEntry.count({ where: { companyId } }),
        prisma.leaveRequest.count({ where: { companyId } }),
        prisma.holiday.count({ where: { companyId } }),
        prisma.notification.count({ where: { companyId } }),
        prisma.role.count({ where: { companyId } }),
        (prisma as any).department?.count({ where: { companyId } }).catch(() => 0) || 0
    ]);

    return {
        totalUsers: users,
        totalDepartments: depts || 0,
        stats: [
            { table: 'Users', count: users, icon: 'users' },
            { table: 'Time Entries', count: timeEntries, icon: 'clock' },
            { table: 'Leaves', count: leaves, icon: 'calendar-off' },
            { table: 'Holidays', count: holidays, icon: 'palmtree' },
            { table: 'Notifications', count: notifications, icon: 'bell' },
            { table: 'Roles', count: roles, icon: 'shield' },
            { table: 'Departments', count: depts || 0, icon: 'building' },
        ]
    };
};

export const getDashboardOverview = async (companyId: string, managerId?: string) => {
    const cacheKey = managerId ? `manager_overview_${managerId}_${companyId}` : `admin_dashboard_overview_${companyId}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;

    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    // Dynamic scoping filter
    const scopeFilter = managerId ? { managerId: managerId, companyId } : { companyId };
    const userScopeFilter = { ...scopeFilter, status: 'ACTIVE' as const, role: { name: { not: 'SUPER_ADMIN' } }, email: { notIn: SEEDED_SYSTEM_EMAILS } };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Run all database queries in parallel for maximum speed
    const [
        totalActiveUsers,
        activeSessions,
        pendingLeaves,
        pendingUsers,
        recentActivity,
        incompleteProfiles,
        roleDistribution,
        roleData,
        payrollStats,
        announcements,
        jobPostings,
        applicants,
        deptDistribution,
        leaveBreakdown,
        managerInfo
    ] = await Promise.all([
        (prisma.user as any).count({ where: userScopeFilter }),
        (prisma.timeEntry as any).findMany({
            where: {
                companyId,
                user: { companyId, email: { notIn: SEEDED_SYSTEM_EMAILS } },
                clockIn: { gte: startOfToday },
                status: { in: ['ACTIVE', 'COMPLETED'] }
            },
            select: {
                id: true,
                clockType: true,
                clockIn: true,
                clockOut: true,
                hoursWorked: true,
                status: true,
                user: { select: { id: true, name: true, department: { select: { name: true } }, deptId: true, managerId: true } }
            }
        }),
        (prisma.leaveRequest as any).count({
            where: {
                status: 'PENDING',
                companyId
            }
        }),
        (prisma.user as any).count({
            where: {
                status: UserStatus.PENDING,
                companyId,
                managerId: managerId 
            }
        }),
        (prisma as any).auditLog.findMany({
            where: { companyId },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { company: { select: { name: true } } }
        }).catch(() => []),
        (prisma.user as any).count({
            where: {
                ...scopeFilter,
                OR: [{ phone: null }, { designation: null }, { department: null }],
                status: 'ACTIVE'
            }
        }),
        (prisma.user as any).groupBy({
            by: ['roleId'],
            where: { companyId },
            _count: { id: true }
        }),
        prisma.role.findMany({
            where: {
                OR: [{ companyId }, { companyId: null }]
            },
            select: { id: true, name: true }
        }),
        (prisma as any).payrollBatch.findFirst({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: { payslips: { select: { netSalary: true, status: true } } }
        }).catch(() => null),
        (prisma as any).announcement.findMany({
            where: { companyId },
            take: 3,
            orderBy: { createdAt: 'desc' }
        }).catch(() => []),
        (prisma.jobPosting as any).count({ where: { companyId, status: 'OPEN' } }).catch(() => 0),
        (prisma as any).applicant?.count({ where: { jobPosting: { companyId } } }).catch(() => 0),
        (prisma.user as any).groupBy({
            by: ['deptId'],
            where: { companyId, status: 'ACTIVE' },
            _count: { id: true }
        }),
        (prisma.leaveRequest as any).groupBy({
            by: ['type'],
            where: { companyId, status: 'APPROVED' },
            _count: { id: true }
        }),
        managerId ? prisma.user.findUnique({ where: { id: managerId, companyId }, select: { department: true } }) : null
    ]);

    const roleMapping = (roleData as any[]).reduce((acc: any, r: any) => {
        acc[r.id] = r.name.toUpperCase();
        return acc;
    }, {});

    const roleCounts = { employee: 0, hr: 0, auditor: 0, support: 0, other: 0 };
    (roleDistribution as any[]).forEach((item: any) => {
        const name = roleMapping[item.roleId] || 'OTHER';
        if (name.includes('EMPLOYEE')) roleCounts.employee += item._count.id;
        else if (name.includes('HR')) roleCounts.hr += item._count.id;
        else if (name.includes('AUDITOR')) roleCounts.auditor += item._count.id;
        else if (name.includes('SUPPORT')) roleCounts.support += item._count.id;
        else roleCounts.other += item._count.id;
    });

    // ── FINANCIALS PROCESSING
    const totalPayroll = payrollStats?.payslips?.reduce((acc: number, p: any) => acc + Number(p.netSalary), 0) || 0;
    const paidEmployees = payrollStats?.payslips?.filter((p: any) => p.status === 'RELEASED').length || 0;
    const pendingPayments = (payrollStats?.payslips?.length || 0) - paidEmployees;

    // ── DEPT PERFORMANCE PROCESSING
    const depts = await (prisma as any).department.findMany({ where: { companyId }, select: { id: true, name: true } });
    
    // Fetch attendance sessions for today to calculate per-dept attendance

    // Fetch leave usage per dept (total days approved)
    const deptLeaves = await (prisma.leaveRequest as any).findMany({
        where: { companyId, status: 'APPROVED' },
        include: { user: { select: { deptId: true } } }
    });

    const performance = depts.map((dept: any) => {
        const usersInDept = (deptDistribution as any[]).find(d => d.deptId === dept.id)?._count.id || 0;
        const presentInDept = activeSessions.filter((s: any) => s.user.deptId === dept.id).length;
        const leavesInDept = deptLeaves.filter((l: any) => l.user.deptId === dept.id).length;
        
        return {
            name: dept.name,
            count: usersInDept,
            attendanceRate: usersInDept > 0 ? Math.round((presentInDept / usersInDept) * 100) : 0,
            leaveUsage: leavesInDept,
            percent: totalActiveUsers > 0 ? Math.round((usersInDept / totalActiveUsers) * 100) : 0
        };
    });

    const uniquePresentUsers = new Set(activeSessions.map((s: any) => s.user?.id)).size;
    const currentlyClocked = activeSessions.filter((s: any) => s.status === 'ACTIVE').length;

    const result = {
        totalActiveUsers,
        clockedIn: currentlyClocked,
        attendanceRate: totalActiveUsers > 0 ? Math.round((uniquePresentUsers / totalActiveUsers) * 100) : 0,
        pendingApprovals: (pendingLeaves || 0) + (pendingUsers || 0),
        roleDistribution: roleCounts,
        recentActivity,
        announcements,
        payroll: { total: totalPayroll, paid: paidEmployees, pending: pendingPayments },
        hiring: { activeJobs: jobPostings, applicants },
        distribution: performance,
        health: { server: 'online', db: 'connected', apiLatency: '18ms' },
        liveSessions: activeSessions.map((s: any) => ({
            id: s.user?.id,
            name: s.user?.name,
            department: s.user?.department?.name,
            clockIn: s.clockIn,
            clockOut: s.clockOut || null,
            hoursWorked: s.hoursWorked || null,
            clockType: s.clockType,
            status: s.status,
        }))
    };

    // Cache for 10 seconds (near real-time)
    cache.set(cacheKey, result, 10);
    return result;
};
