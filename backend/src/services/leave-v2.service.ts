import prisma from '../config/db';

export const createLeaveType = async (companyId: string, data: any) => {
    return (prisma as any).leaveTypeConfig.create({
        data: {
            ...data,
            companyId
        }
    });
};

export const getLeaveTypes = async (companyId: string) => {
    return (prisma as any).leaveTypeConfig.findMany({
        where: { companyId }
    });
};

export const initializeBalancesForUser = async (userId: string, companyId: string, overrides?: { sick?: number, casual?: number, earned?: number }) => {
    const configs = await (prisma as any).leaveTypeConfig.findMany({
        where: { companyId }
    });
 
    const currentYear = new Date().getFullYear();
 
    const balances = configs.map((config: any) => {
        let total = Number(config.totalDays);
        if (overrides) {
            const code = (config.code || "").toUpperCase();
            if (code === 'SICK' && overrides.sick !== undefined) total = overrides.sick;
            if (code === 'CASUAL' && overrides.casual !== undefined) total = overrides.casual;
            if (code === 'EARNED' && overrides.earned !== undefined) total = overrides.earned;
        }

        return {
            userId,
            companyId,
            leaveTypeId: config.id,
            total,
            used: 0,
            pending: 0,
            year: currentYear
        };
    });
 
    return (prisma as any).leaveBalance.createMany({
        data: balances,
        skipDuplicates: true
    });
};

export const requestLeaveV2 = async (userId: string, companyId: string, data: { leaveTypeId: string, startDate: Date, endDate: Date, reason?: string, type: any }) => {
    // Check balance first
    const balance = await (prisma as any).leaveBalance.findFirst({
        where: { userId, companyId, leaveTypeId: data.leaveTypeId, year: new Date().getFullYear() }
    });

    if (!balance) throw new Error('No leave balance found for this type');

    const duration = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (balance.total - balance.used - balance.pending < duration) {
        throw new Error('Insufficient leave balance');
    }

    const request = await prisma.$transaction(async (tx) => {
        // Update pending balance
        await (tx as any).leaveBalance.update({
            where: { id: balance.id },
            data: { pending: { increment: duration } }
        });

        // Create request
        return (tx as any).leaveRequest.create({
            data: {
                ...data,
                userId,
                companyId,
                status: 'PENDING'
            },
            include: { user: true, leaveTypeConfig: true }
        });
    });

    try {
        const { sendLeaveRequestNotification } = await import('./email.service');
        const { generateLeaveActionToken, buildLeaveActionUrl } = await import('../routes/leave-email-action.routes');
        const superAdmins = await (prisma as any).user.findMany({
            where: { companyId, role: { name: 'SUPER_ADMIN' } }
        });

        const employeeName = (request.user as any)?.name || 'Employee';
        const leaveTypeName = request.leaveTypeConfig?.name || 'Leave';

        for (const admin of superAdmins) {
            if (admin.email) {
                const approveToken = generateLeaveActionToken(request.id, admin.id, companyId, 'approve');
                const rejectToken = generateLeaveActionToken(request.id, admin.id, companyId, 'reject');
                const approveUrl = buildLeaveActionUrl(approveToken);
                const rejectUrl = buildLeaveActionUrl(rejectToken);

                await sendLeaveRequestNotification(
                    admin.email,
                    employeeName,
                    leaveTypeName,
                    new Date(data.startDate).toDateString(),
                    new Date(data.endDate).toDateString(),
                    approveUrl,
                    rejectUrl
                ).catch((err: any) => console.error("Failed to send leave notification email:", err));
            }
        }
    } catch (error) {
        console.error("Error notifying super admins:", error);
    }

    return request;
};

export const approveLeaveV2 = async (requestId: string, companyId: string, approvedBy: string) => {
    const request = await (prisma as any).leaveRequest.findUnique({
        where: { id: requestId, companyId },
        include: { leaveTypeConfig: true }
    });

    if (!request || request.status !== 'PENDING') throw new Error('Invalid or non-pending request');

    const duration = Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return prisma.$transaction(async (tx) => {
        // Update balance
        await (tx as any).leaveBalance.update({
            where: {
                userId_leaveTypeId_year: {
                    userId: request.userId,
                    leaveTypeId: request.leaveTypeId!,
                    year: new Date(request.startDate).getFullYear()
                }
            },
            data: {
                pending: { decrement: duration },
                used: { increment: duration }
            }
        });

        // Update request status
        return (tx as any).leaveRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                approvedBy
            }
        });
    });
};
