import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const notifications = await notificationService.getNotifications(user.id, user.companyId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        await notificationService.markAsRead(id, user.id, user.companyId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to mark as read" });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        await notificationService.markAllAsRead(user.id, user.companyId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to mark all as read" });
    }
};
