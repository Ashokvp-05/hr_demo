import prisma from '../config/db';
import { NotificationType } from "@prisma/client";

export const getNotifications = async (userId: string, companyId?: string) => {
    return prisma.notification.findMany({
        where: { userId, ...(companyId ? { companyId } : {}) },
        orderBy: { createdAt: "desc" },
        take: 50
    });
};

export const markAsRead = async (id: string, userId: string, companyId?: string) => {
    return prisma.notification.updateMany({
        where: { id, userId, ...(companyId ? { companyId } : {}) },
        data: { isRead: true }
    });
};

export const markAllAsRead = async (userId: string, companyId?: string) => {
    return prisma.notification.updateMany({
        where: { userId, ...(companyId ? { companyId } : {}), isRead: false },
        data: { isRead: true }
    });
};

import { broadcast } from './websocket.service';

export const createNotification = async (data: {
    userId: string,
    companyId?: string,
    title: string,
    message: string,
    type: NotificationType,
    actionData?: any
}) => {
    const notification = await prisma.notification.create({
        data
    });

    // Fire realtime websocket event to instantly push this to the user's dashboard
    broadcast('NEW_NOTIFICATION', notification);

    return notification;
};
