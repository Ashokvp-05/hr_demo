import { Request, Response } from 'express';
import prisma from '../config/db';
import * as auditService from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import cache from '../config/cache';

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const companyId = user.companyId;
        const cacheKey = `announcements_${companyId}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            where: {
                companyId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            }
        });

        cache.set(cacheKey, announcements, 3600); // 1 hour
        res.json(announcements);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { title, content, type, priority, expiresAt, eventDate, targetAudience, recipientIds } = req.body;
        const user = (req as AuthRequest).user;

        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type: type || 'INFO',
                priority: priority || 'NORMAL',
                createdBy: user.id,
                companyId: user.companyId,
                eventDate: eventDate ? new Date(eventDate) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        cache.del(`announcements_${user.companyId}`);

        // ── Build recipient list based on targetAudience ──
        let targetUsers: { id: string }[] = [];
        const audience = targetAudience || 'ALL';

        if (audience === 'SPECIFIC' && Array.isArray(recipientIds) && recipientIds.length > 0) {
            // Only the hand-picked employees
            targetUsers = await prisma.user.findMany({
                where: { companyId: user.companyId, id: { in: recipientIds }, status: 'ACTIVE' },
                select: { id: true }
            });
        } else if (audience === 'MANAGERS') {
            // Only users whose role name contains MANAGER or ADMIN
            targetUsers = await prisma.user.findMany({
                where: {
                    companyId: user.companyId,
                    status: 'ACTIVE',
                    role: { name: { in: ['MANAGER', 'HR_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'OPS_ADMIN', 'COMPANY_ADMIN'] } }
                },
                select: { id: true }
            });
        } else if (audience === 'EMPLOYEES') {
            // Only non-manager/non-admin staff
            targetUsers = await prisma.user.findMany({
                where: {
                    companyId: user.companyId,
                    status: 'ACTIVE',
                    role: { name: { in: ['EMPLOYEE', 'HR', 'AUDITOR'] } }
                },
                select: { id: true }
            });
        } else {
            // ALL — broadcast to everyone
            targetUsers = await prisma.user.findMany({
                where: { companyId: user.companyId, status: 'ACTIVE' },
                select: { id: true }
            });
        }

        if (targetUsers.length > 0) {
            const notifications = targetUsers.map(u => ({
                userId: u.id,
                companyId: user.companyId,
                title: `Announcement: ${title}`,
                message: content,
                type: 'INFO' as any
            }));
            await prisma.notification.createMany({
                data: notifications,
                skipDuplicates: true
            });
        }

        res.status(201).json(announcement);
        auditService.logAction('ANNOUNCEMENT_CREATE', user.id, user.companyId, announcement.id, `Created announcement: ${title} (audience: ${audience}, recipients: ${targetUsers.length})`);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        await (prisma.announcement as any).delete({
            where: { id, companyId: user.companyId }
        });

        cache.del(`announcements_${user.companyId}`);
        auditService.logAction('ANNOUNCEMENT_DELETE', user.id!, user.companyId, id, `Deleted announcement ${id}`);
        res.json({ message: 'Announcement deleted' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
