import prisma from '../config/db';
import { createNotification } from './notification.service';
import cache from '../config/cache';

export const giveKudos = async (fromUserId: string, toUserId: string, companyId: string, message: string, category: string) => {
    // 1. Create Kudos
    const kudos = await (prisma as any).kudos.create({
        data: {
            fromUserId,
            toUserId,
            companyId,
            message,
            category
        },
        include: {
            fromUser: { select: { name: true } },
            toUser: { select: { name: true } }
        }
    });

    // 2. Notify recipient
    try {
        await createNotification({
            userId: toUserId,
            companyId,
            title: "New Kudos Received! 🎉",
            message: `${kudos.fromUser.name} recognized you for '${category}': ${message.substring(0, 50)}...`,
            type: 'SUCCESS'
        });
    } catch (e) {
        console.error("Failed to notify kudos recipient", e);
    }

    // 3. Invalidate caches
    cache.del(`kudos_received_${toUserId}`);
    cache.del(`kudos_given_${fromUserId}`);
    cache.del(`company_kudos_feed_${companyId}`);

    return kudos;
};

export const getReceivedKudos = async (userId: string, companyId: string) => {
    const cacheKey = `kudos_received_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const kudos = await (prisma as any).kudos.findMany({
        where: { toUserId: userId, companyId },
        include: {
            fromUser: { select: { name: true, designation: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    cache.set(cacheKey, kudos, 300);
    return kudos;
};

export const getGivenKudos = async (userId: string, companyId: string) => {
    const cacheKey = `kudos_given_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const kudos = await (prisma as any).kudos.findMany({
        where: { fromUserId: userId, companyId },
        include: {
            toUser: { select: { name: true, designation: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    cache.set(cacheKey, kudos, 300);
    return kudos;
};

export const getCompanyKudosFeed = async (companyId: string, limit: number = 20) => {
    const cacheKey = `company_kudos_feed_${companyId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const feed = await (prisma as any).kudos.findMany({
        where: { companyId },
        include: {
            fromUser: { select: { name: true, designation: true } },
            toUser: { select: { name: true, designation: true } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
    });

    cache.set(cacheKey, feed, 60); // Feed caches for 1 min
    return feed;
};

export const getKudosAnalytics = async (companyId: string) => {
    const analytics = await (prisma as any).kudos.groupBy({
        by: ['category'],
        where: { companyId },
        _count: {
            _all: true
        }
    });

    return analytics;
};
