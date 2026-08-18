import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getEmployeeDashboard = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const data = await dashboardService.getEmployeeDashboardData(user.id, user.companyId);
        res.status(200).json(data);
    } catch (error: any) {
        console.error('Employee dashboard error:', error?.message || error);
        res.status(500).json({ error: 'Dashboard data temporarily unavailable', message: error.message });
    }
};

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const data = await dashboardService.getAdminStats(user.companyId);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getManagerDashboard = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const data = await dashboardService.getManagerDashboardData(user.id, user.companyId);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getManagerPerformance = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const data = await dashboardService.getManagerPerformance(user.id, user.companyId);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getManagerProductivity = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const data = await dashboardService.getManagerProductivity(user.id, user.companyId);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
