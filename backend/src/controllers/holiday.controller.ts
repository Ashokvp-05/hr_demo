import { Request, Response } from 'express';
import * as holidayService from '../services/holiday.service';
import * as auditService from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export const sync = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized/No Company' });

        const year = req.body.year || new Date().getFullYear();
        const result = await holidayService.syncHolidays(year, user.companyId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const list = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const holidays = await holidayService.getHolidays(year, user.companyId);
        res.json(holidays);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, date, year, isFloater } = req.body;

        if (!name || !date) {
            return res.status(400).json({ error: 'Holiday name and date are required' });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const holiday = await holidayService.createHoliday({
            name,
            date: parsedDate,
            year: year || parsedDate.getFullYear(),
            isFloater: isFloater ?? false,
            companyId: user.companyId
        });

        // Broadcast to all active users so it shows in the Notification Bell
        try {
            const users = await prisma.user.findMany({
                where: { companyId: user.companyId, status: 'ACTIVE' },
                select: { id: true }
            });

            if (users.length > 0) {
                const notifications = users.map(u => ({
                    userId: u.id,
                    companyId: user.companyId!,
                    title: `New Holiday Added: ${name}`,
                    message: `A new holiday '${name}' has been added on ${parsedDate.toDateString()}.`,
                    type: 'INFO' as any
                }));
                await prisma.notification.createMany({
                    data: notifications,
                    skipDuplicates: true
                });
            }
        } catch (notifError: any) {
            console.error('[Holiday] Notification broadcast failed:', notifError.message);
            // Don't fail the holiday creation because of notification issues
        }

        res.status(201).json(holiday);
        auditService.logAction('HOLIDAY_CREATE', user.id!, user.companyId, holiday.id, `Created holiday: ${name} on ${parsedDate.toDateString()}`);
    } catch (error: any) {
        console.error('[Holiday] Create failed:', error.message, error.code);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A holiday already exists on this date' });
        }
        res.status(500).json({ error: error.message || 'Failed to create holiday' });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const result = await holidayService.deleteHoliday(id, user.companyId);
        if (!result) return res.status(404).json({ error: 'Holiday not found' });
        auditService.logAction('HOLIDAY_DELETE', user.id!, user.companyId, id, `Deleted holiday ${id}`);
        res.json({ message: 'Holiday deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
