import { Request, Response } from 'express';
import * as leaveV2Service from '../services/leave-v2.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const createLeaveType = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.companyId) throw new Error('Unauthorized');
        const leaveType = await leaveV2Service.createLeaveType(user.companyId, req.body);
        res.status(201).json(leaveType);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getLeaveTypes = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.companyId) throw new Error('Unauthorized');
        const leaveTypes = await leaveV2Service.getLeaveTypes(user.companyId);
        res.status(200).json(leaveTypes);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const initializeBalancesForUser = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.companyId) throw new Error('Unauthorized');
        const { userId } = req.body;
        await leaveV2Service.initializeBalancesForUser(userId, user.companyId);
        res.status(200).json({ message: 'Balances initialized' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const requestLeave = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.id || !user?.companyId) throw new Error('Unauthorized');
        const { leaveTypeId, startDate, endDate, reason, type } = req.body;
        const request = await leaveV2Service.requestLeaveV2(user.id, user.companyId, { leaveTypeId, startDate, endDate, reason, type });
        res.status(201).json(request);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const approveLeave = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.id || !user?.companyId) throw new Error('Unauthorized');
        const { requestId } = req.params;
        const approvedRequest = await leaveV2Service.approveLeaveV2(requestId, user.companyId, user.id);
        res.status(200).json(approvedRequest);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
