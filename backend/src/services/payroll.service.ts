import prisma from '../config/db';
import { Decimal } from '@prisma/client/runtime/library';
import cache from '../config/cache';
import { createNotification } from './notification.service';

export const calculateMonthlySalary = async (userId: string, companyId: string, month: string, year: number) => {
    // 1. Fetch Salary Config
    const config = await (prisma.salaryConfig as any).findUnique({
        where: { userId }
    });

    if (!config) {
        throw new Error(`Salary configuration not found for user ${userId}`);
    }

    // 2. Fetch Unpaid Leaves
    const startDate = new Date(year, parseInt(month) - 1, 1);
    const endDate = new Date(year, parseInt(month), 0);

    const unpaidLeaves = await (prisma.leaveRequest as any).findMany({
        where: {
            userId,
            companyId,
            type: 'UNPAID',
            status: 'APPROVED',
            startDate: { gte: startDate },
            endDate: { lte: endDate }
        }
    });

    let unpaidDays = 0;
    unpaidLeaves.forEach((leave: any) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        unpaidDays += days;
    });

    // 4. Calculations
    const basic = config.basicSalary as Decimal;
    const hra = config.hra as Decimal;
    const da = config.da as Decimal;
    const bonus = config.bonus as Decimal;
    const other = config.otherAllowances as Decimal;

    const grossSalary = new Decimal(basic.toNumber() + hra.toNumber() + da.toNumber() + bonus.toNumber() + other.toNumber());

    const leaveDeduction = new Decimal((basic.toNumber() / 30) * unpaidDays);
    const pfDeduction = config.pf as Decimal;
    const taxDeduction = config.tax as Decimal;

    const totalDeductions = new Decimal(pfDeduction.toNumber() + taxDeduction.toNumber() + leaveDeduction.toNumber());

    const netSalary = new Decimal(grossSalary.toNumber() - totalDeductions.toNumber());

    return {
        basicSalary: basic,
        hra,
        da,
        bonus,
        otherAllowances: other,
        grossSalary,
        pfDeduction,
        taxDeduction,
        leaveDeduction,
        totalDeductions,
        netSalary
    };
};

export const createPayrollBatch = async (companyId: string, month: string, year: number, createdBy: string) => {
    // Check if batch already exists for this company
    const existing = await (prisma as any).payrollBatch.findFirst({
        where: { month, year, companyId }
    });

    if (existing) {
        throw new Error(`Payroll batch for ${month}/${year} already exists for this company`);
    }

    return (prisma as any).payrollBatch.create({
        data: {
            month,
            year,
            companyId,
            status: 'DRAFT',
            createdBy
        }
    });
};

export const generatePayslipsForBatch = async (batchId: string, companyId: string) => {
    const batch = await (prisma as any).payrollBatch.findFirst({
        where: { id: batchId, companyId }
    });

    if (!batch) throw new Error("Batch not found for this company");
    if (batch.status !== 'DRAFT') throw new Error("Batch is not in DRAFT status");

    // Fetch all active users in this company with salary config
    const users = await (prisma.user as any).findMany({
        where: {
            companyId,
            status: 'ACTIVE',
            salaryConfig: { isNot: null }
        },
        include: { salaryConfig: true }
    });

    const payslips = [];

    for (const user of users) {
        try {
            const calculation = await calculateMonthlySalary(user.id, companyId, batch.month, batch.year);

            const payNumber = `PAY-${batch.year}${batch.month.padStart(2, '0')}-${user.id.substring(0, 4).toUpperCase()}`;

            const payslip = await (prisma.payslip as any).upsert({
                where: { userId_month_year: { userId: user.id, month: batch.month, year: batch.year } },
                update: {
                    ...calculation,
                    batchId: batch.id,
                    companyId,
                    status: 'DRAFT'
                },
                create: {
                    userId: user.id,
                    companyId,
                    batchId: batch.id,
                    month: batch.month,
                    year: batch.year,
                    payNumber,
                    ...calculation,
                    status: 'DRAFT'
                }
            });
            payslips.push(payslip);
        } catch (error) {
            console.error(`Failed to generate payslip for user ${user.id}:`, error);
        }
    }

    return payslips;
};

export const updateBatchStatus = async (batchId: string, companyId: string, status: any, approvedBy?: string) => {
    const updateData: any = { status };
    if (status === 'APPROVED' && approvedBy) {
        updateData.approvedBy = approvedBy;
    }
    if (status === 'RELEASED') {
        updateData.releasedAt = new Date();
    }

    const batch = await (prisma as any).payrollBatch.update({
        where: { id: batchId, companyId },
        data: updateData
    });

    // Update all payslips in this batch
    await (prisma.payslip as any).updateMany({
        where: { batchId, companyId },
        data: { status }
    });

    // If released, invalidate caches and notify users
    if (status === 'RELEASED') {
        const slips = await (prisma.payslip as any).findMany({
            where: { batchId, companyId },
            select: { userId: true, month: true, year: true }
        });

        for (const slip of slips) {
            // Invalidate caches
            cache.del(`my_payslips_${slip.userId}`);
            cache.del(`dashboard_data_${slip.userId}`);

            // Send Notification
            try {
                await createNotification({
                    userId: slip.userId,
                    companyId,
                    title: "Payroll Released",
                    message: `Official payslip for ${slip.month} ${slip.year} is now ready for view.`,
                    type: 'SUCCESS'
                });
            } catch (e) { }
        }
    }

    return batch;
};

export const getMyPayslips = async (userId: string, companyId: string) => {
    return (prisma.payslip as any).findMany({
        where: {
            userId,
            companyId,
            status: 'RELEASED'
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
};

export const getBatchDetails = async (batchId: string, companyId: string) => {
    return (prisma as any).payrollBatch.findFirst({
        where: { id: batchId, companyId },
        include: {
            payslips: {
                include: { user: { select: { name: true, phone: true, department: true, designation: true } } }
            }
        }
    });
};

export const getAllBatches = async (companyId: string) => {
    return (prisma as any).payrollBatch.findMany({
        where: { companyId },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        include: {
            _count: {
                select: { payslips: true }
            }
        }
    });
};

// --- SALARY CONFIG & IDENTITY FINANCE ---

export const getSalaryConfig = async (userId: string, companyId: string) => {
    return (prisma.salaryConfig as any).findUnique({
        where: { userId, companyId }
    });
};

export const updateSalaryConfig = async (userId: string, companyId: string, data: any) => {
    return (prisma.salaryConfig as any).upsert({
        where: { userId },
        update: { ...data, companyId },
        create: { ...data, userId, companyId }
    });
};

export const getBankDetails = async (userId: string, companyId: string) => {
    return (prisma as any).bankDetails.findUnique({
        where: { userId }
    });
};

export const updateBankDetails = async (userId: string, companyId: string, data: any) => {
    return (prisma as any).bankDetails.upsert({
        where: { userId },
        update: { ...data },
        create: { ...data, userId }
    });
};

export const getTaxDetails = async (userId: string, companyId: string) => {
    return (prisma as any).taxDetails.findUnique({
        where: { userId }
    });
};

export const updateTaxDetails = async (userId: string, companyId: string, data: any) => {
    return (prisma as any).taxDetails.upsert({
        where: { userId },
        update: { ...data },
        create: { ...data, userId }
    });
};

export const getPayrollDashboardStats = async (companyId: string) => {
    const totalUsers = await (prisma.user as any).count({
        where: { companyId, status: 'ACTIVE' }
    });

    const configuredUsers = await (prisma.salaryConfig as any).count({
        where: { companyId }
    });

    const latestBatch = await (prisma as any).payrollBatch.findFirst({
        where: { companyId },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        include: {
            payslips: {
                select: { netSalary: true }
            }
        }
    });

    let totalExpenditure = 0;
    if (latestBatch) {
        totalExpenditure = latestBatch.payslips.reduce((acc: number, slip: any) => acc + Number(slip.netSalary), 0);
    }

    return {
        totalEmployees: totalUsers,
        configuredEmployees: configuredUsers,
        missingConfig: totalUsers - configuredUsers,
        latestBatchStatus: latestBatch?.status || 'N/A',
        latestBatchDate: latestBatch ? `${latestBatch.month}/${latestBatch.year}` : 'N/A',
        estimatedExpenditure: totalExpenditure
    };
};
