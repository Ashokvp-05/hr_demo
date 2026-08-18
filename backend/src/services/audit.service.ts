import prisma from '../config/db';

export const logAction = async (action: string, adminId: string, companyId: string, targetId?: string, details?: string) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                adminId,
                companyId,
                targetId,
                details
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

export const getAuditLogs = async (companyId: string) => {
    return prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 100
    });
};
