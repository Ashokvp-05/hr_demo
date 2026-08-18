import prisma from '../config/db';
import cache from '../config/cache';
import { LeaveType, LeaveStatus, NotificationType } from '@prisma/client';

interface CreateLeaveRequestDTO {
    userId: string;
    companyId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason?: string;
}

export const createRequest = async (data: CreateLeaveRequestDTO) => {
    // Check for overlaps within the same user/company
    const overlapping = await prisma.leaveRequest.findFirst({
        where: {
            userId: data.userId,
            companyId: data.companyId,
            status: { not: LeaveStatus.REJECTED },
            OR: [
                { startDate: { lte: data.endDate }, endDate: { gte: data.startDate } }
            ]
        }
    });
    if (overlapping) throw new Error('Leave request overlaps with an existing request');

    // Check Balance
    const balance = await getBalance(data.userId, new Date().getFullYear(), data.companyId);
    const daysRequested = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if ((data.type === LeaveType.SICK || data.type === LeaveType.MEDICAL) && balance.sick < daysRequested)
        throw new Error(`Insufficient Medical/Sick Leave balance. Available: ${balance.sick}`);

    if (data.type === LeaveType.CASUAL && balance.casual < daysRequested)
        throw new Error(`Insufficient Casual Leave balance. Available: ${balance.casual}`);
    if (data.type === LeaveType.EARNED && balance.earned < daysRequested)
        throw new Error(`Insufficient Earned Leave balance. Available: ${balance.earned}`);

    const request = await prisma.leaveRequest.create({
        data: {
            userId: data.userId,
            companyId: data.companyId,
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason
        },
        include: { user: true }
    });

    try {
        const { sendLeaveRequestNotification, sendLeaveSubmissionConfirmation } = await import('./email.service');
        const { generateLeaveActionToken, buildLeaveActionUrl } = await import('../routes/leave-email-action.routes');
        const adminsToNotify = await prisma.user.findMany({
            where: { 
                companyId: data.companyId, 
                role: { 
                    name: { in: ['SUPER_ADMIN', 'HR_ADMIN', 'COMPANY_ADMIN', 'HR'] } 
                } 
            }
        });

        const employeeName = (request.user as any)?.name || 'Employee';
        const employeeEmail = (request.user as any)?.email;
        const leaveTypeName = data.type;

        // Notify User of successful submission
        if (employeeEmail) {
            await sendLeaveSubmissionConfirmation(
                employeeEmail,
                employeeName,
                leaveTypeName,
                new Date(data.startDate).toDateString(),
                new Date(data.endDate).toDateString(),
                data.companyId
            ).catch(err => console.error("Failed to send user leave submission email:", err));
        }

        for (const admin of adminsToNotify) {
            if (admin.email) {
                const approveToken = generateLeaveActionToken(request.id, admin.id, data.companyId, 'approve');
                const rejectToken = generateLeaveActionToken(request.id, admin.id, data.companyId, 'reject');
                const approveUrl = buildLeaveActionUrl(approveToken);
                const rejectUrl = buildLeaveActionUrl(rejectToken);

                await sendLeaveRequestNotification(
                    admin.email,
                    employeeName,
                    leaveTypeName,
                    new Date(data.startDate).toDateString(),
                    new Date(data.endDate).toDateString(),
                    approveUrl,
                    rejectUrl,
                    data.companyId,
                    "Swot HR Department"
                ).catch(err => console.error("Failed to send leave notification email to admin:", err));
            }
        }
    } catch (error) {
        console.error("Error notifying admins:", error);
    }

    return request;
};

export const getUserRequests = async (userId: string, companyId: string) => {
    return prisma.leaveRequest.findMany({
        where: { userId, companyId },
        orderBy: { createdAt: 'desc' }
    });
};

export const getAllRequests = async (companyId: string, departmentId?: string, managerId?: string) => {
    const where: any = { companyId };
    if (departmentId) where.user = { department: departmentId };
    if (managerId) where.user = { managerId: managerId };

    const requests = await prisma.leaveRequest.findMany({
        where,
        include: { user: { select: { name: true, email: true, department: true } } },
        orderBy: { createdAt: 'desc' }
    });

    // Resolve approvedBy user names
    const approverIds = [...new Set(requests.filter(r => r.approvedBy).map(r => r.approvedBy as string))];
    const approvers = approverIds.length > 0
        ? await prisma.user.findMany({ where: { id: { in: approverIds } }, select: { id: true, name: true } })
        : [];
    const approverMap = new Map(approvers.map(a => [a.id, a.name]));

    return requests.map(r => ({
        ...r,
        approvedByName: r.approvedBy ? approverMap.get(r.approvedBy) || null : null
    }));
};

export const getLeaveBalance = async (userId: string, year = new Date().getFullYear(), companyId: string) => {
    const cacheKey = `leave_balance_${userId}_${year}_${companyId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached as any;

    // Fetch all leave type balances for the user for this year
    const balances = await prisma.leaveBalance.findMany({
        where: { userId, year },
        include: { leaveTypeConfig: { select: { code: true, name: true } } }
    });

    // Aggregate into a summary object the frontend expects
    const summary: Record<string, any> = {
        sick: 0, casual: 0, earned: 0, medical: 0,
        sickUsed: 0, casualUsed: 0, earnedUsed: 0,
        sickPending: 0, casualPending: 0, earnedPending: 0,
        items: balances
    };

    for (const b of balances) {
        const code = (b.leaveTypeConfig?.code || '').toLowerCase();
        if (code === 'sick' || code === 'sl') {
            summary.sick = b.total; summary.sickUsed = b.used; summary.sickPending = b.pending;
        } else if (code === 'casual' || code === 'cl') {
            summary.casual = b.total; summary.casualUsed = b.used; summary.casualPending = b.pending;
        } else if (code === 'earned' || code === 'el' || code === 'pl') {
            summary.earned = b.total; summary.earnedUsed = b.used; summary.earnedPending = b.pending;
        } else if (code === 'medical' || code === 'ml') {
            summary.medical = b.total;
        }
    }

    cache.set(cacheKey, summary, 300);
    return summary;
};

export const getBalance = getLeaveBalance;

export const updateStatus = async (requestId: string, status: LeaveStatus, adminId: string, companyId: string, reason?: string) => {
    return prisma.$transaction(async (tx) => {
        const request = await tx.leaveRequest.findFirst({
            where: { id: requestId, companyId }
        });
        if (!request) throw new Error("Request not found or unauthorized");
        if (request.status !== LeaveStatus.PENDING) throw new Error("Request is not pending");

        // If Approving, Deduct Balance
        if (status === LeaveStatus.APPROVED) {
            const days = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const year = new Date().getFullYear();

            // Find the leave balance record for this userId and relevant leave type
            const balance = await tx.leaveBalance.findFirst({
                where: {
                    userId: request.userId,
                    year,
                    leaveTypeConfig: {
                        code: { in: ['SICK', 'SL', 'CASUAL', 'CL', 'EARNED', 'EL', 'PL', 'MEDICAL', 'ML'] }
                    }
                },
                include: { leaveTypeConfig: { select: { code: true } } }
            });

            if (balance && balance.total - balance.used >= days) {
                await tx.leaveBalance.update({
                    where: { id: balance.id },
                    data: { used: { increment: days } }
                });
                cache.del(`leave_balance_${request.userId}_${year}_${companyId}`);
            }
        }

        const updatedRequest = await tx.leaveRequest.update({
            where: { id: requestId },
            data: { status, approvedBy: adminId, rejectionReason: reason },
            include: { user: true }
        });

        await prisma.notification.create({
            data: {
                userId: request.userId,
                companyId: companyId,
                title: `Leave Request ${status}`,
                message: `Your leave request from ${request.startDate.toLocaleDateString()} to ${request.endDate.toLocaleDateString()} has been ${status.toLowerCase()}.${reason ? ` Reason: ${reason}` : ''}`,
                type: status === LeaveStatus.APPROVED ? NotificationType.SUCCESS : NotificationType.ALERT
            }
        });

        // Send Email Notification to User
        try {
            const { sendLeaveStatusUpdate } = await import('./email.service');
            const employeeName = (updatedRequest.user as any)?.name || 'Employee';
            const employeeEmail = (updatedRequest.user as any)?.email;
            if (employeeEmail) {
                await sendLeaveStatusUpdate(
                    employeeEmail,
                    employeeName,
                    status,
                    updatedRequest.type,
                    reason,
                    companyId
                ).catch(err => console.error("Failed to send user status update email:", err));
            }
        } catch (error) {
            console.error("Error sending status update email:", error);
        }

        return updatedRequest;
    });
};
