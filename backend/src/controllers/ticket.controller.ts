import { Request, Response } from 'express';
import prisma from '../config/db';
import * as auditService from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const createTicket = async (req: Request, res: Response) => {
    try {
        const { title, description, priority, category, module, attachments } = req.body;
        const user = (req as AuthRequest).user;

        if (!user?.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // 1. Create ticket
        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                category: category || 'BUG',
                module,
                attachments,
                userId: user.id,
                companyId: user.companyId,
                status: 'OPEN'
            }
        });

        // 2. Generate and update token based on ticketNumber
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticket.id, companyId: user.companyId },
            data: {
                token: `ISS-${ticket.ticketNumber}`
            }
        });

        res.status(201).json(updatedTicket);
        auditService.logAction('TICKET_CREATE', user.id, user.companyId, updatedTicket.id, `Created ticket: ${title} (${updatedTicket.token})`);
    } catch (error: any) {
        console.error("❌ Error in createTicket:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getTicketAnalytics = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const canViewAll = ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'HELPDESK_ADMIN', 'MANAGER', 'HR', 'OPS_ADMIN', 'HR_ADMIN'].includes(user.role || '');
        const where: any = { companyId: user.companyId };
        if (!canViewAll && user.companyId) {
            where.OR = [
                { userId: user.id },
                { assignedToId: user.id }
            ];
        }

        const [byStatus, byPriority, byCategory, total] = await Promise.all([
            prisma.ticket.groupBy({
                by: ['status'],
                where,
                _count: { status: true }
            }),
            prisma.ticket.groupBy({
                by: ['priority'],
                where,
                _count: { priority: true }
            }),
            prisma.ticket.groupBy({
                by: ['category'],
                where,
                _count: { category: true }
            }),
            prisma.ticket.count({ where })
        ]);

        const analytics = {
            total,
            status: byStatus.map((item: any) => ({ name: item.status, value: item._count.status })),
            priority: byPriority.map((item: any) => ({ name: item.priority, value: item._count.priority })),
            category: byCategory.map((item: any) => ({ name: item.category, value: item._count.category }))
        };

        res.json(analytics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getTickets = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const canViewAll = ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'HELPDESK_ADMIN', 'MANAGER', 'HR', 'OPS_ADMIN', 'HR_ADMIN'].includes(user.role || '');

        const where: any = { companyId: user.companyId };
        if (!canViewAll && user.companyId) {
            where.OR = [
                { userId: user.id },
                { assignedToId: user.id }
            ];
        }

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                assignedTo: { select: { name: true, email: true } },
                comments: {
                    include: { user: { select: { name: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        res.json(tickets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, priority, category } = req.body;
        const user = (req as AuthRequest).user;

        if (!user?.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const where: any = { id, companyId: user.companyId };

        // Fetch existing ticket to get the reporter userId
        const existingTicket = await prisma.ticket.findUnique({ where: { id }, select: { userId: true, title: true, status: true, ticketNumber: true, companyId: true } });
        if (!existingTicket) return res.status(404).json({ error: 'Ticket not found' });

        const data: any = {};
        if (status) data.status = status;
        if (priority) data.priority = priority;
        if (category) data.category = category;

        const ticket = await prisma.ticket.update({
            where,
            data
        });

        // Send notification to the employee who raised the ticket (if status changed by someone else)
        if (status && status !== existingTicket.status && existingTicket.userId !== user.id) {
            const statusLabels: Record<string, string> = {
                OPEN: 'reopened',
                IN_PROGRESS: 'being worked on',
                RESOLVED: 'resolved',
                CLOSED: 'closed',
            };
            const statusLabel = statusLabels[status] || status.toLowerCase();
            const notifType = status === 'RESOLVED' || status === 'CLOSED' ? 'SUCCESS' : 'INFO';

            await prisma.notification.create({
                data: {
                    userId: existingTicket.userId,
                    companyId: existingTicket.companyId,
                    title: `Ticket #${existingTicket.ticketNumber || ''} ${statusLabel}`,
                    message: `Your ticket "${existingTicket.title}" has been ${statusLabel} by the support team.`,
                    type: notifType as any,
                }
            });
        }

        res.json(ticket);
        auditService.logAction('TICKET_UPDATE', user.id, user.companyId, id, `Updated ticket #${existingTicket.ticketNumber}: ${Object.keys(data).join(', ')}`);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const assignTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { assignedToId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user?.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const where: any = { id, companyId: user.companyId };

        const ticket = await prisma.ticket.update({
            where,
            data: { assignedToId }
        });

        res.json(ticket);
        auditService.logAction('TICKET_ASSIGN', user.id, user.companyId, id, `Assigned ticket to user ${assignedToId}`);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


export const addComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const user = (req as AuthRequest).user;

        if (!user?.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify ticket belongs to company
        const where: any = { id, companyId: user.companyId };

        const ticket = await prisma.ticket.findUnique({
            where
        });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const comment = await prisma.ticketComment.create({
            data: {
                content,
                isInternal: req.body.isInternal || false,
                ticketId: id,
                userId: user.id
            },
            include: { user: { select: { name: true, avatarUrl: true } } }
        });

        res.status(201).json(comment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getTicketById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user?.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const where: any = { id, companyId: user.companyId };

        const ticket = await prisma.ticket.findUnique({
            where,
            include: {
                user: { select: { name: true, email: true, avatarUrl: true } },
                assignedTo: { select: { name: true, email: true } },
                comments: {
                    include: { user: { select: { name: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        res.json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
