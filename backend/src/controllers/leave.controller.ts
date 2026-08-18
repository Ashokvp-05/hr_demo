import { Request, Response } from 'express';
import * as leaveService from '../services/leave.service';
import * as auditService from '../services/audit.service';
import { broadcast, triggerDashboardUpdate } from '../services/websocket.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { LeaveType, LeaveStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from '../config/db';

const createRequestSchema = z.object({
    type: z.any(), // Temporary fix for stale enum cache
    startDate: z.string().datetime().or(z.string()), // Accept ISO string
    endDate: z.string().datetime().or(z.string()),
    reason: z.string().optional()
});

export const createRequest = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized and no company assigned' });

        const validation = createRequestSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors });
        }

        const data = validation.data;
        const request = await leaveService.createRequest({
            userId: user.id,
            companyId: user.companyId,
            type: data.type,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            reason: data.reason
        });

        res.json(request);
        auditService.logAction('LEAVE_REQUEST_CREATE', user.id, user.companyId, request.id, `Submitted ${data.type} leave request`);
        broadcast('LEAVE_CREATED', request);
        triggerDashboardUpdate();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getMyRequests = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const requests = await leaveService.getUserRequests(user.id, user.companyId);
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getBalance = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const balance = await leaveService.getBalance(user.id, new Date().getFullYear(), user.companyId);
        res.json(balance);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllRequests = async (req: Request, res: Response) => {
    try {
        const loggedInUser = (req as AuthRequest).user;
        if (!loggedInUser?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const requests = await leaveService.getAllRequests(loggedInUser.companyId);
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const approveRequest = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const request = await leaveService.updateStatus(id, LeaveStatus.APPROVED, user.id, user.companyId);
        auditService.logAction('LEAVE_APPROVE', user.id, user.companyId, id, `Approved leave request ${id}`);
        broadcast('LEAVE_UPDATED', request);
        triggerDashboardUpdate();
        res.json(request);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const rejectRequest = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const { reason } = req.body;
        const request = await leaveService.updateStatus(id, LeaveStatus.REJECTED, user.id, user.companyId, reason);
        auditService.logAction('LEAVE_REJECT', user.id, user.companyId, id, `Rejected leave request ${id}${reason ? ': ' + reason : ''}`);
        broadcast('LEAVE_UPDATED', request);
        triggerDashboardUpdate();
        res.json(request);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteRequest = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;

        // Verify the leave request belongs to the same company
        const existing = await prisma.leaveRequest.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!existing) return res.status(404).json({ error: 'Leave request not found' });

        await prisma.leaveRequest.delete({ where: { id } });

        auditService.logAction('LEAVE_DELETE', user.id, user.companyId, id, `Deleted leave request ${id}`);
        broadcast('LEAVE_DELETED', { id });
        triggerDashboardUpdate();
        res.json({ success: true, message: 'Leave request deleted' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
