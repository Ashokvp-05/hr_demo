import prisma from '../config/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * BUSINESS INTELLIGENCE (BI) & ADVANCED ANALYTICS SERVICE
 * Aggregates data from all organizational modules for executive oversight.
 */

export const getExecutiveOverview = async (companyId: string) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // 1. PERSONNEL METRICS
    const totalUsers = await prisma.user.count({ where: { companyId } });
    const activeUsers = await prisma.user.count({ where: { companyId, status: 'ACTIVE' } });

    // 2. FINANCIAL PROTOCOL (PAYROLL)
    const payrollAgg = await prisma.payslip.aggregate({
        where: {
            companyId,
            batch: { status: 'RELEASED' }
        },
        _sum: { netSalary: true },
        _count: { id: true }
    });

    // 3. OPERATIONAL HEALTH (ATTENDANCE)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const presentToday = await prisma.timeEntry.count({
        where: {
            companyId,
            clockIn: { gte: today }
        }
    });

    // 4. TALENT PIPELINE (RECRUITMENT)
    const activeJobs = await prisma.jobPosting.count({ where: { companyId, status: 'OPEN' } });
    const totalApplicants = await prisma.applicant.count({
        where: { job: { companyId } }
    });

    // 5. CULTURAL PULSE (KUDOS)
    const totalKudos = await prisma.kudos.count({ where: { companyId } });

    // 6. DEPARTMENTAL DISTRIBUTION
    const deptDistribution = await prisma.department.findMany({
        where: { companyId },
        include: { _count: { select: { users: true } } }
    });

    const totalSpent = payrollAgg._sum.netSalary ? Number(payrollAgg._sum.netSalary) : 0;

    return {
        personnel: {
            total: totalUsers,
            active: activeUsers,
            retentionRate: 98.5 // Simulated for now
        },
        financial: {
            totalSpent,
            batchesCount: payrollAgg._count.id
        },
        operations: {
            absenteeism: totalUsers > 0 ? ((totalUsers - presentToday) / totalUsers) * 100 : 0,
            presentCount: presentToday
        },
        recruitment: {
            openPositions: activeJobs,
            applicantFlow: totalApplicants
        },
        culture: {
            engagementScore: totalUsers > 0 ? (totalKudos / totalUsers) * 10 : 0
        },
        departments: deptDistribution.map(d => ({
            name: d.name,
            count: d._count.users
        })),
        insights: {
            attritionRisk: totalUsers > 0 ? (totalKudos < totalUsers / 2 ? 'HIGH' : 'LOW') : 'STABLE',
            budgetVariance: totalSpent * 0.05, // 5% simulated variance
            velocityStatus: 'ACCELERATING'
        }
    };
};

export const getPerformanceTrends = async (companyId: string) => {
    // Aggregating historical performance data
    const reviews = await prisma.performanceReview.findMany({
        where: { user: { companyId } },
        select: {
            reviewCycle: true,
            overallRating: true,
            createdAt: true
        },
        orderBy: { createdAt: 'asc' }
    });

    // Group by cycle
    const group = reviews.reduce((acc: any, curr) => {
        if (!acc[curr.reviewCycle]) acc[curr.reviewCycle] = { sum: 0, count: 0 };
        acc[curr.reviewCycle].sum += curr.overallRating;
        acc[curr.reviewCycle].count += 1;
        return acc;
    }, {});

    return Object.keys(group).map(cycle => ({
        cycle,
        average: group[cycle].sum / group[cycle].count
    }));
};
