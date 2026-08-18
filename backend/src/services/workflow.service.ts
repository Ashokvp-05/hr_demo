import prisma from '../config/db';
import { ClaimType, ClaimStatus, NotificationType } from '@prisma/client';
import { createNotification } from './notification.service';
import { logAction } from './audit.service';

/**
 * WORKFLOW AUTOMATION ENGINE
 * Handles multi-level routing and lifecycle for internal claims.
 */

export const createExpenseClaim = async (userId: string, companyId: string, data: any) => {
    const claim = await prisma.expenseClaim.create({
        data: {
            userId,
            companyId,
            amount: data.amount,
            category: data.category,
            description: data.description,
            receiptUrl: data.receiptUrl,
            status: 'PENDING'
        }
    });

    // Initialize Approval Chain (Multi-level)
    await setupApprovalChain(claim.id, companyId, 'EXPENSE');

    return claim;
};

export const createSalaryAdvance = async (userId: string, companyId: string, data: any) => {
    const advance = await prisma.salaryAdvance.create({
        data: {
            userId,
            companyId,
            amount: data.amount,
            reason: data.reason,
            repaymentTerms: data.repaymentTerms,
            status: 'PENDING'
        }
    });

    await setupApprovalChain(advance.id, companyId, 'ADVANCE');

    return advance;
};

const setupApprovalChain = async (claimId: string, companyId: string, type: 'EXPENSE' | 'ADVANCE') => {
    // Find approvers within the same company
    const hr_managers = await prisma.user.findMany({
        where: { role: { name: 'HR_MANAGER', companyId }, companyId },
        take: 1
    });

    const finance = await prisma.user.findMany({
        where: { role: { name: 'FINANCE_ADMIN', companyId }, companyId },
        take: 1
    });

    const steps = [];

    // Level 1: HR Manager
    if (hr_managers[0]) {
        steps.push({
            claimId,
            claimType: type,
            approverId: hr_managers[0].id,
            stepOrder: 1,
            status: 'PENDING' as any
        });
    }

    // Level 2: Finance
    if (finance[0]) {
        steps.push({
            claimId,
            claimType: type,
            approverId: finance[0].id,
            stepOrder: 2,
            status: 'PENDING' as any
        });
    }

    if (steps.length > 0) {
        // @ts-ignore
        await prisma.approvalStep.createMany({ data: steps });

        // Notify the first approver
        await createNotification({
            userId: steps[0].approverId,
            companyId,
            title: `New ${type} Claim Pending`,
            message: `A new request requires your verification. Level: ${steps[0].stepOrder}`,
            type: NotificationType.ALERT
        });
    }
};

export const processApproval = async (stepId: string, approverId: string, companyId: string, status: 'APPROVED' | 'REJECTED', comments?: string) => {
    const step = await (prisma.approvalStep as any).findUnique({
        where: { id: stepId },
        include: { approver: true }
    });

    if (!step || step.approverId !== approverId || step.approver.companyId !== companyId) {
        throw new Error("Unauthorized or invalid step");
    }
    if (step.status !== 'PENDING') throw new Error("Step already processed");

    const updatedStep = await (prisma.approvalStep as any).update({
        where: { id: stepId },
        data: { status, comments, processedAt: new Date() }
    });

    if (status === 'REJECTED') {
        if (step.claimType === 'EXPENSE') {
            await prisma.expenseClaim.update({ where: { id: step.claimId, companyId }, data: { status: 'REJECTED' } });
        } else {
            await prisma.salaryAdvance.update({ where: { id: step.claimId, companyId }, data: { status: 'REJECTED' } });
        }
        return { message: "Workflow halted - Claim Rejected" };
    }

    // Approved - Check for next step
    const nextStep = await (prisma.approvalStep as any).findFirst({
        where: {
            claimId: step.claimId,
            claimType: step.claimType,
            stepOrder: step.stepOrder + 1
        }
    });

    if (nextStep) {
        if (step.claimType === 'EXPENSE') {
            await prisma.expenseClaim.update({ where: { id: step.claimId, companyId }, data: { currentStep: nextStep.stepOrder } });
        } else {
            await prisma.salaryAdvance.update({ where: { id: step.claimId, companyId }, data: { currentStep: nextStep.stepOrder } });
        }

        await createNotification({
            userId: nextStep.approverId,
            companyId,
            title: `Escalated ${step.claimType} Claim`,
            message: `A request has been approved at level ${step.stepOrder} and requires your action.`,
            type: NotificationType.INFO
        });

        return { message: "Advanced to next level", nextLevel: nextStep.stepOrder };
    } else {
        if (step.claimType === 'EXPENSE') {
            await prisma.expenseClaim.update({ where: { id: step.claimId, companyId }, data: { status: 'APPROVED' } });
        } else {
            await prisma.salaryAdvance.update({ where: { id: step.claimId, companyId }, data: { status: 'APPROVED' } });
        }
        return { message: "Workflow completed - Fully Approved" };
    }
};
