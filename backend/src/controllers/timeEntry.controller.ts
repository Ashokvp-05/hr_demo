import { Request, Response } from 'express';
import * as timeEntryService from '../services/timeEntry.service';
import { triggerDashboardUpdate } from '../services/websocket.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { ClockType } from '@prisma/client';
import cache from '../config/cache';

export const getActive = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const targetUserId = (req.query.userId as string) || user.id;

        // Simple permission check: if requesting for another user, must be admin/manager
        if (targetUserId !== user.id && !['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER', 'MANAGER'].includes(user.role || '')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const entry = await timeEntryService.getActiveEntry(targetUserId, user.companyId);
        res.json(entry);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const clockIn = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const { type, location, isOnCall } = req.body;
        const clockType = type || 'IN_OFFICE'; // Default to IN_OFFICE if not specified

        const entry = await timeEntryService.clockIn(user.id, user.companyId, clockType as ClockType, location, isOnCall);
        triggerDashboardUpdate();
        res.json(entry);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const clockOut = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const { customClockOut } = req.body;
        const clockOutTime = customClockOut ? new Date(customClockOut) : undefined;

        const entry = await timeEntryService.clockOut(user.id, user.companyId, clockOutTime);
        triggerDashboardUpdate();
        res.json(entry);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const limit = parseInt(req.query.limit as string) || 10;
        const skip = parseInt(req.query.skip as string) || 0;
        
        // Correctly handle month 0 (January)
        const monthStr = req.query.month as string;
        const month = monthStr !== undefined && monthStr !== '' ? parseInt(monthStr) : undefined;
        
        const yearStr = req.query.year as string;
        const year = yearStr !== undefined && yearStr !== '' ? parseInt(yearStr) : undefined;

        const targetUserId = (req.query.userId as string) || user.id;

        // Simple permission check
        if (targetUserId !== user.id && !['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER', 'MANAGER'].includes(user.role || '')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const history = await timeEntryService.getHistory(targetUserId, user.companyId, limit, skip, month, year);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSummary = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const targetUserId = (req.query.userId as string) || user.id;

        // Simple permission check
        if (targetUserId !== user.id && !['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER', 'MANAGER'].includes(user.role || '')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const cacheKey = `summary_${targetUserId}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const summary = await timeEntryService.getSummary(targetUserId, user.companyId);
        cache.set(cacheKey, summary, 300); // Cache for 5 mins
        res.json(summary);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllActiveUsers = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const activeUsers = await timeEntryService.getAllActiveUsers(user.companyId);
        res.json(activeUsers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAttendanceByDate = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // Only admins/managers can view company-wide attendance
        if (!['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER', 'HR_ADMIN', 'MANAGER'].includes(user.role || '')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const dateStr = req.query.date as string; // yyyy-MM-dd
        let targetDate: Date;
        if (dateStr) {
            targetDate = new Date(dateStr + 'T00:00:00');
        } else {
            targetDate = new Date();
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const entries = await timeEntryService.getEntriesByDate(user.companyId, startOfDay, endOfDay);
        res.json(entries);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
