import prisma from '../config/db';
import { Company } from '@prisma/client';

export const getAllCompanies = async () => {
    return prisma.company.findMany({
        include: {
            _count: {
                select: { users: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const getCompanyById = async (id: string) => {
    return prisma.company.findUnique({
        where: { id },
        include: {
            _count: {
                select: { users: true }
            }
        }
    });
};

export const updateCompanyStatus = async (id: string, status: string) => {
    return prisma.company.update({
        where: { id },
        data: { status }
    });
};

export const createCompany = async (data: Partial<Company>) => {
    return prisma.company.create({
        data: {
            name: data.name!,
            domain: data.domain,
            subdomain: data.subdomain,
            status: 'ACTIVE'
        }
    });
};

export const getPlatformStats = async () => {
    const [totalCompanies, totalUsers, activeUsers] = await Promise.all([
        prisma.company.count(),
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } })
    ]);

    return {
        totalCompanies,
        totalUsers,
        activeUsers
    };
};

export const getSuperAdminDashboard = async () => {
    const [
        companies,
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        totalCompanies,
        activeCompanies,
        adminAccounts,
        tickets,
        globalAnnouncements,
        recentAuditLogs,
        plans,
    ] = await Promise.all([
        // All companies with user counts & role details
        prisma.company.findMany({
            include: {
                _count: {
                    select: { users: true, roles: true, tickets: true }
                },
                users: {
                    select: { id: true, status: true },
                },
                plan: {
                    select: { name: true, price: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),

        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { status: 'SUSPENDED' } }),

        prisma.company.count(),
        prisma.company.count({ where: { status: 'ACTIVE' } }),

        // Monitor Admin Accounts across all companies
        prisma.user.findMany({
            where: {
                role: {
                    name: { in: ['COMPANY_ADMIN', 'ADMIN'] }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
                company: { select: { name: true, domain: true } },
                role: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        }),

        // Support Tickets across platform
        prisma.ticket.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                company: { select: { name: true } },
                assignedTo: { select: { name: true } }
            }
        }),

        // Global Announcements (Platform wide)
        prisma.announcement.findMany({
            where: { companyId: null },
            orderBy: { createdAt: 'desc' },
            take: 10
        }),

        // Recent audit logs (platform-wide)
        prisma.auditLog.findMany({
            take: 30,
            orderBy: { createdAt: 'desc' },
            include: {
                company: { select: { name: true } }
            }
        }),

        // Subscription Plans
        prisma.subscriptionPlan.findMany({
            include: {
                _count: { select: { companies: true } }
            }
        }),
    ]);

    // Compute per-company active/inactive stats
    const companiesWithStats = companies.map(c => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        subdomain: c.subdomain,
        status: c.status,
        createdAt: c.createdAt,
        totalUsers: c._count.users,
        totalTickets: c._count.tickets,
        activeUsers: c.users.filter(u => u.status === 'ACTIVE').length,
        plan: (c as any).plan?.name || 'N/A',
        price: Number((c as any).plan?.price || 0),
    }));

    return {
        platform: {
            totalCompanies,
            activeCompanies,
            blockedCompanies: totalCompanies - activeCompanies,
            totalUsers,
            activeUsers,
            pendingUsers,
            suspendedUsers,
            inactiveUsers: totalUsers - activeUsers - pendingUsers - suspendedUsers,
            totalTickets: tickets.length,
            dailyActiveUsers: Math.floor(activeUsers * 0.85), // Real-time simulation
            growthRate: "+12.5%", // Simulated growth
        },
        companies: companiesWithStats,
        adminAccounts,
        tickets,
        globalAnnouncements,
        recentAuditLogs,
        plans: plans.map(p => ({ ...p, price: Number(p.price) })),
    };
}
