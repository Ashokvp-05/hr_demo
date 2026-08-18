import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserStatus } from '@prisma/client';
import prisma from '../config/db';
import cache from '../config/cache';
import { JWT_SECRET } from '../config/env';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        companyId: string;
        roleId?: string;
        role?: string;
        status: UserStatus;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // --- CACHED USER & CONFIG CHECK ---
        const cacheKeyUser = `auth_user_${decoded.id}`;
        const cacheKeyLockdown = `system_lockdown`;

        let cachedUser = cache.get(cacheKeyUser) as any;
        if (!cachedUser) {
            const dbUser = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { tokenVersion: true, status: true, companyId: true, role: { select: { name: true } } }
            });
            if (dbUser) {
                cachedUser = dbUser;
                cache.set(cacheKeyUser, cachedUser, 30); // Cache for 30s
            }
        }

        // tokenVersion: null/undefined from old JWTs or seeded users is treated as 0
        const jwtVersion   = decoded.tokenVersion  ?? 0;
        const dbVersion    = cachedUser.tokenVersion ?? 0;

        if (!cachedUser || jwtVersion !== dbVersion) {
            return res.status(401).json({ error: 'Session expired or invalidated' });
        }

        // Attach user info to request
        req.user = {
            ...decoded,
            companyId: cachedUser.companyId,
            role: cachedUser.role?.name,
            status: cachedUser.status
        };

        // --- CACHED LOCKDOWN CHECK ---
        let isLockdown = cache.get(cacheKeyLockdown);
        if (isLockdown === undefined) {
            const lockdownConfig = await prisma.systemConfig.findFirst({
                where: { key: 'lockdownMode', companyId: cachedUser.companyId || null }
            });
            isLockdown = lockdownConfig?.value === true;
            cache.set(cacheKeyLockdown, isLockdown, 300); // Cache for 5 mins
        }

        const isSuperAdmin = cachedUser.role?.name === 'SUPER_ADMIN';

        if (isLockdown && !isSuperAdmin) {
            return res.status(503).json({
                error: 'System In Lockdown',
                message: 'Terminal access restricted by command authority.'
            });
        }

        // Check if user is active
        if (cachedUser.status !== 'ACTIVE' && cachedUser.status !== 'PENDING') {
            return res.status(403).json({ error: 'Account is not active' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Ensures the user belongs to the company they are trying to access.
 * Super Admins bypass this.
 */
export const tenantGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });

    // Super Admin can access anything
    if (req.user.role === 'SUPER_ADMIN') {
        return next();
    }

    // Capture companyId from various possible places (header, query, or body)
    // Most API requests should pass it or it's inferred from the user
    const targetCompanyId = req.headers['x-company-id'] || req.query.companyId || req.body.companyId;

    if (targetCompanyId && targetCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied: Company mismatch' });
    }

    next();
};

export const authorize = (allowedRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Access denied: No role assigned' });
        }

        // SUPER_ADMIN usually has access to everything designated for admins
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        const userRole = (req.user.role || '').toUpperCase().replace(/\s+/g, '_');
        const normalizedAllowed = allowedRoles.map(r => r.toUpperCase().replace(/\s+/g, '_'));

        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
        }

        next();
    };
};

export const requireRole = authorize;
