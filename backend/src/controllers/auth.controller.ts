import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendOtpEmail, sendAccessApprovalEmail } from '../services/email.service';
import { z } from 'zod';
import prisma from '../config/db';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env';
import { UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export const register = async (req: Request, res: Response) => {
    try {
        const user = await authService.requestRegistration(req.body);
        res.status(201).json({ message: 'Registration successful', user });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const registerCompany = async (req: Request, res: Response) => {
    try {
        const result = await authService.registerCompany(req.body);
        res.status(201).json({
            message: 'Company registration successful. You can now login.',
            ...result
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const user = await authService.verifyCredentials(req.body);
        res.status(200).json({ message: 'Login successful', user });
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        await authService.requestPasswordReset(req.body.email);
        res.status(200).json({ message: 'Password reset link sent to your email' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(userId, currentPassword, newPassword);
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
export const verify2FALogin = async (req: Request, res: Response) => {
    try {
        const { userId, code } = req.body;
        const result = await authService.verify2FALogin(userId, code);
        res.status(200).json({ message: '2FA verification successful', ...result });
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};

export const setup2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await authService.setup2FA(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const activate2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { code } = req.body;
        const result = await authService.activate2FA(userId, code);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const disable2FA = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await authService.disable2FA(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const logoutOthers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await authService.logoutOthers(userId);
        res.status(200).json({ message: 'All other devices logged out successfully. Future requests from those devices will require a fresh login.' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        const result = await authService.verifyEmail(token);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await authService.refreshToken(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
}

// In-memory demo auth tables
const otpStore: Record<string, { otp: string; expires: number }> = {};

// ── Single-session enforcement for non-company emails ──
// Tracks which non-@rudratic.com emails currently have an active session.
// key = normalised email, value = login timestamp
const activeSessions: Record<string, number> = {};

const COMPANY_DOMAIN = 'rudratic.com'; // exempt from single-session rule

// ── File-backed Access Requests Store ──
// Persists across server restarts so pending approvals are not lost.
const ACCESS_REQUESTS_FILE = path.join(process.cwd(), 'access_requests.json');

type AccessRequest = { fullName: string; email: string; company: string; phone?: string; reason?: string; status: 'pending' | 'approved' | 'rejected'; createdAt?: string; };

function loadAccessRequests(): Record<string, AccessRequest> {
    try {
        if (fs.existsSync(ACCESS_REQUESTS_FILE)) {
            const raw = fs.readFileSync(ACCESS_REQUESTS_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[ACCESS STORE] Failed to load access_requests.json, starting fresh.');
    }
    return {};
}

function saveAccessRequests(store: Record<string, AccessRequest>): void {
    try {
        fs.writeFileSync(ACCESS_REQUESTS_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (e) {
        console.error('[ACCESS STORE] Failed to save access_requests.json:', e);
    }
}

const accessRequests: Record<string, AccessRequest> = loadAccessRequests();
console.log(`[ACCESS STORE] Loaded ${Object.keys(accessRequests).length} access request(s) from disk.`);

const LOGIN_LOGS_FILE = path.join(process.cwd(), 'login_logs.json');

type LoginLog = {
    fullName: string;
    email: string;
    company: string;
    phone: string;
    createdAt: string;
};

function loadLoginLogs(): Record<string, LoginLog> {
    try {
        if (fs.existsSync(LOGIN_LOGS_FILE)) {
            const raw = fs.readFileSync(LOGIN_LOGS_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[LOGIN LOGS] Failed to load login_logs.json, starting fresh.');
    }
    return {};
}

function saveLoginLogs(store: Record<string, LoginLog>): void {
    try {
        fs.writeFileSync(LOGIN_LOGS_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (e) {
        console.error('[LOGIN LOGS] Failed to save login_logs.json:', e);
    }
}

const loginLogs: Record<string, LoginLog> = loadLoginLogs();
console.log(`[LOGIN LOGS] Loaded ${Object.keys(loginLogs).length} login log(s) from disk.`);

const businessLoginDetailsTemp: Record<string, { fullName?: string; companyName?: string; phone?: string }> = {};

export const requestOtp = async (req: Request, res: Response) => {
    try {
        const { email, fullName, companyName, phone } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const lowerEmail = email.toLowerCase().trim();
        const domain = lowerEmail.split('@')[1] || '';

        // If it's a @rudratic.com domain (or not requiring approval), temporarily save details
        if (domain === COMPANY_DOMAIN) {
            businessLoginDetailsTemp[lowerEmail] = {
                fullName,
                companyName,
                phone
            };
        }

        // Personal/free email domains require admin approval first
        const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'email.com', 'aol.com', 'icloud.com', 'protonmail.com'];
        if (personalDomains.includes(domain)) {
            const reqAccess = accessRequests[lowerEmail];
            if (!reqAccess || reqAccess.status !== 'approved') {
                return res.status(403).json({
                    error: "Personal email requires admin approval. Use 'Request Access' on the login page.",
                    needsApproval: true
                });
            }
        }

        // Single-session enforcement: non-company emails may only be logged in once at a time
        if (domain !== COMPANY_DOMAIN && activeSessions[lowerEmail]) {
            return res.status(409).json({
                error: "This email is already logged in on another session. Please log out first.",
                alreadyLoggedIn: true
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[lowerEmail] = { otp, expires: Date.now() + 10 * 60 * 1000 };

        // Log OTP to console in development mode or for personal emails
        const isPersonalEmail = !lowerEmail.endsWith('@' + COMPANY_DOMAIN);
        const shouldShowOtp = process.env.NODE_ENV !== 'production' || isPersonalEmail;

        if (shouldShowOtp) {
            console.log(`\n=========================================`);
            console.log(`🔑 DEMO OTP FOR ${lowerEmail}: ${otp}`);
            console.log(`=========================================\n`);
        }

        try { await sendOtpEmail(lowerEmail, otp); }
        catch (emailError) { /* email optional in demo */ }

        // Return OTP in response for demo mode or personal email guests.
        // This allows the frontend to display it directly so visitors don't need backend access.
        res.json({
            message: "OTP sent successfully",
            ...(shouldShowOtp && { demoOtp: otp })
        });
    } catch (error: any) {
        console.error("Error requesting OTP:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const requestAccess = async (req: Request, res: Response) => {
    try {
        const { fullName, email, company, phone, reason } = req.body;
        if (!fullName || !email || !company) {
            return res.status(400).json({ error: "Full Name, Email, and Company are required" });
        }

        const lowerEmail = email.toLowerCase().trim();

        // Check if already approved — don't downgrade status
        if (accessRequests[lowerEmail]?.status === 'approved') {
            return res.status(200).json({ message: "Access already approved. You can log in now." });
        }

        accessRequests[lowerEmail] = {
            fullName,
            email: lowerEmail,
            company,
            phone: phone || "",
            reason: reason || "",
            status: 'pending',  // Admin must approve from /admin dashboard
            createdAt: new Date().toISOString()
        };
        saveAccessRequests(accessRequests);

        console.log(`[ACCESS REQUEST] Pending approval: ${fullName} (${lowerEmail}) — ${company}`);
        return res.status(200).json({ message: "Access request submitted. Please wait for admin approval." });
    } catch (error: any) {
        console.error("Failed to process access request:", error);
        res.status(500).json({ error: "Failed to process access request" });
    }
};

// GET /api/auth/access-requests — Admin: list all access requests
export const getAccessRequests = async (req: Request, res: Response) => {
    try {
        const list = Object.values(accessRequests).sort((a: any, b: any) =>
            a.status === 'pending' ? -1 : 1
        );
        res.json({ requests: list });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch access requests" });
    }
};

// GET /api/auth/access-requests-public?secret=xxx — No login needed, secret-key protected
export const getAccessRequestsPublic = async (req: Request, res: Response) => {
    try {
        const { secret } = req.query;
        const expectedSecret = process.env.ADMIN_APPROVE_SECRET;
        if (!expectedSecret || secret !== expectedSecret) {
            return res.status(401).json({ error: "Invalid secret." });
        }
        const list = Object.values(accessRequests).sort((a: any, b: any) =>
            a.status === 'pending' ? -1 : 1
        );
        res.json({ requests: list });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch access requests" });
    }
};

// POST /api/auth/update-access — Admin: approve or reject a request
export const updateAccessStatus = async (req: Request, res: Response) => {
    try {
        const { email, status } = req.body;
        if (!email || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "email and status ('approved'|'rejected') required" });
        }
        const lowerEmail = email.toLowerCase().trim();
        if (!accessRequests[lowerEmail]) {
            return res.status(404).json({ error: "Access request not found" });
        }
        accessRequests[lowerEmail].status = status;
        saveAccessRequests(accessRequests);
        // If approved, fire off the approval notification email
        if (status === 'approved') {
            sendAccessApprovalEmail(lowerEmail).catch(() => {});
        }
        console.log(`[ACCESS] ${lowerEmail} → ${status}`);
        res.json({ message: `Access ${status} for ${lowerEmail}` });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to update access status" });
    }
};

// POST /api/auth/admin-approve — Bootstrap: approve a request using shared secret (no login required)
// Useful when no admin session exists yet (fresh installs, demos).
// Secret is set in .env as ADMIN_APPROVE_SECRET
export const adminBootstrapApprove = async (req: Request, res: Response) => {
    try {
        const { email, secret, action } = req.body;
        const expectedSecret = process.env.ADMIN_APPROVE_SECRET;

        if (!expectedSecret || secret !== expectedSecret) {
            return res.status(401).json({ error: "Invalid secret. Access denied." });
        }
        if (!email) {
            return res.status(400).json({ error: "Email is required." });
        }

        const status = action === 'reject' ? 'rejected' : 'approved';
        const lowerEmail = email.toLowerCase().trim();

        if (!accessRequests[lowerEmail]) {
            return res.status(404).json({ error: `No access request found for ${lowerEmail}` });
        }

        accessRequests[lowerEmail].status = status;
        saveAccessRequests(accessRequests);

        if (status === 'approved') {
            sendAccessApprovalEmail(lowerEmail).catch(() => {});
        }

        console.log(`[BOOTSTRAP APPROVE] ${lowerEmail} → ${status} (via shared secret)`);
        return res.json({
            message: `Access ${status} for ${lowerEmail}. User can now request an OTP to log in.`,
            email: lowerEmail,
            status
        });
    } catch (error: any) {
        console.error('adminBootstrapApprove error:', error);
        res.status(500).json({ error: "Failed to process approval." });
    }
};

// POST /api/auth/session-logout — clears the active session lock for an email
// Called by the frontend on logout so the user can log in again on a fresh session.
export const sessionLogout = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });
        const lowerEmail = email.toLowerCase().trim();
        if (activeSessions[lowerEmail]) {
            delete activeSessions[lowerEmail];
            console.log(`[SESSION] Session cleared for ${lowerEmail}`);
        }
        res.json({ message: "Session cleared" });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to clear session" });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

        const lowerEmail = email.toLowerCase().trim();
        const record = otpStore[lowerEmail];

        // === DEBUG: log what we have ===
        const stored = record?.otp;
        const received = String(otp).trim();
        console.log(`\n[OTP DEBUG] email received  : "${email}"`);
        console.log(`[OTP DEBUG] email normalised : "${lowerEmail}"`);
        console.log(`[OTP DEBUG] stored otp keys  : ${JSON.stringify(Object.keys(otpStore))}`);
        console.log(`[OTP DEBUG] stored otp value : "${stored}" (type: ${typeof stored})`);
        console.log(`[OTP DEBUG] received otp     : "${received}" (type: ${typeof received})`);
        console.log(`[OTP DEBUG] match?            : ${stored === received}\n`);

        if (!record) {
            return res.status(400).json({ error: "No OTP requested for this email" });
        }
        if (Date.now() > record.expires) {
            delete otpStore[lowerEmail];
            return res.status(400).json({ error: "OTP has expired" });
        }
        // Robust comparison: trim whitespace + coerce to string on both sides
        if (stored !== received) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        delete otpStore[lowerEmail];

        // Mark this email as having an active session (non-company emails only)
        const otpDomain = lowerEmail.split('@')[1] || '';
        if (otpDomain !== COMPANY_DOMAIN) {
            activeSessions[lowerEmail] = Date.now();
            console.log(`[SESSION] Active session started for ${lowerEmail}`);
        }

        // Retrieve or automatically register the user in the database
        let user = await prisma.user.findUnique({
            where: { email: lowerEmail },
            include: { role: true, company: { select: { name: true } } }
        });

        if (!user) {
            // Find root company or default company
            let defaultCompany = await prisma.company.findFirst();
            if (!defaultCompany) {
                defaultCompany = await prisma.company.create({
                    data: {
                        name: "Default Company",
                        subdomain: "default",
                        domain: "hrms.com",
                        status: "ACTIVE"
                    }
                });
            }

            // Ensure the company has the required demo roles (COMPANY_ADMIN + EMPLOYEE)
            const existingRoles = await prisma.role.findMany({
                where: { companyId: defaultCompany.id }
            });
            const existingNames = existingRoles.map((r: any) => r.name);

            if (!existingNames.includes('COMPANY_ADMIN')) {
                await prisma.role.create({
                    data: {
                        name: 'COMPANY_ADMIN',
                        companyId: defaultCompany.id,
                        permissions: {
                            manage_settings: true,
                            manage_employees: true,
                            manage_roles: true,
                            view_reports: true,
                            configure_payroll: true
                        } as any
                    }
                });
            }
            if (!existingNames.includes('EMPLOYEE')) {
                await prisma.role.create({
                    data: {
                        name: 'EMPLOYEE',
                        companyId: defaultCompany.id,
                        permissions: {
                            self_service: true,
                            view_payslips: true,
                            apply_leave: true,
                            clock_in_out: true
                        } as any
                    }
                });
            }

            // Now reliably fetch the EMPLOYEE role as the default
            let defaultRole = await prisma.role.findFirst({
                where: { name: 'EMPLOYEE', companyId: defaultCompany.id }
            });
            if (!defaultRole) {
                defaultRole = await prisma.role.findFirst({
                    where: { companyId: defaultCompany.id }
                });
            }

            const username = lowerEmail.split('@')[0];
            const dummyPassword = await bcrypt.hash(Math.random().toString(36), 12);
            user = await prisma.user.create({
                data: {
                    email: lowerEmail,
                    name: username.charAt(0).toUpperCase() + username.slice(1),
                    password: dummyPassword,
                    status: UserStatus.ACTIVE,
                    roleId: defaultRole?.id,
                    companyId: defaultCompany.id,
                    emailVerified: true
                },
                include: { role: true, company: { select: { name: true } } }
            });
        }

        // ── LOG SUCCESSFUL LOGIN TO LOGIN_LOGS ──
        try {
            const domain = lowerEmail.split('@')[1] || '';
            let loginPhone = "";
            let loginCompany = (user as any).company?.name || "Rudratic";
            let loginName = user?.name || user.email.split('@')[0];

            if (domain === COMPANY_DOMAIN) {
                const tempDetails = businessLoginDetailsTemp[lowerEmail];
                if (tempDetails) {
                    loginPhone = tempDetails.phone || "";
                    loginCompany = tempDetails.companyName || loginCompany;
                    loginName = tempDetails.fullName || loginName;
                }
            } else {
                const reqAccess = accessRequests[lowerEmail];
                if (reqAccess) {
                    loginPhone = reqAccess.phone || "";
                    loginCompany = reqAccess.company || loginCompany;
                    loginName = reqAccess.fullName || loginName;
                }
            }

            loginLogs[lowerEmail] = {
                fullName: loginName,
                email: lowerEmail,
                company: loginCompany,
                phone: loginPhone,
                createdAt: new Date().toISOString()
            };
            saveLoginLogs(loginLogs);
        } catch (err) {
            console.error("[LOGIN LOGS] Failed to save login log:", err);
        }

        const demoExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes demo window
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                companyId: user.companyId,
                companyName: (user as any).company?.name,
                roleId: user.roleId,
                role: user.role?.name,
                status: user.status,
                tokenVersion: (user as any).tokenVersion,
                demoExpiresAt,
                isDemo: true
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN as any }
        );

        return res.json({
            token,
            demoExpiresAt,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                companyId: user.companyId,
                companyName: (user as any).company?.name,
                roleId: user.roleId,
                role: user.role?.name,
                status: user.status
            }
        });
    } catch (error: any) {
        console.error("Failed to verify OTP:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
    }
};

export const updateDemoRole = async (req: Request, res: Response) => {
    try {
        const { roleName } = req.body; // e.g. "ADMIN" or "EMPLOYEE"
        const userId = (req as any).user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!roleName) {
            return res.status(400).json({ error: "Role name is required" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Role alias map: frontend sends simple names, DB may have compound names
        const roleAliases: Record<string, string[]> = {
            'ADMIN': ['ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'OPS_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN'],
            'EMPLOYEE': ['EMPLOYEE', 'STAFF', 'USER'],
            'HR_MANAGER': ['HR_MANAGER', 'HR', 'MANAGER'],
        };
        const normalizedName = roleName.toUpperCase();
        const candidates = roleAliases[normalizedName] ?? [normalizedName];

        // Try each candidate name in the user's company first, then globally
        let targetRole = null;
        for (const candidate of candidates) {
            targetRole = await prisma.role.findFirst({
                where: { name: candidate, companyId: user.companyId }
            });
            if (targetRole) break;
        }
        // Global fallback (any company)
        if (!targetRole) {
            for (const candidate of candidates) {
                targetRole = await prisma.role.findFirst({ where: { name: candidate } });
                if (targetRole) break;
            }
        }
        // Last resort: pick any role in the company based on intent
        if (!targetRole && user.companyId) {
            const isAdminIntent = candidates.some(c => c.includes('ADMIN') || c.includes('MANAGER'));
            if (isAdminIntent) {
                // Any role that is NOT a plain employee role
                targetRole = await prisma.role.findFirst({
                    where: { companyId: user.companyId, NOT: { name: { in: ['EMPLOYEE', 'STAFF', 'USER'] } } }
                });
            } else {
                // Any role in the company
                targetRole = await prisma.role.findFirst({ where: { companyId: user.companyId } });
            }
        }

        // Absolute last resort: CREATE the role in the user's company on the fly
        // (handles existing users whose company was created before roles were seeded)
        if (!targetRole && user.companyId) {
            const isAdminIntent = candidates.some(c => c.includes('ADMIN') || c.includes('MANAGER'));
            const roleToCreate = isAdminIntent ? 'COMPANY_ADMIN' : 'EMPLOYEE';
            const permissions = isAdminIntent
                ? { manage_settings: true, manage_employees: true, manage_roles: true, view_reports: true, configure_payroll: true }
                : { self_service: true, view_payslips: true, apply_leave: true, clock_in_out: true };
            targetRole = await prisma.role.create({
                data: { name: roleToCreate, companyId: user.companyId, permissions: permissions as any }
            });
        }

        if (!targetRole) {
            return res.status(404).json({ error: "Role not found in database" });
        }

        // Update the user's role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { roleId: targetRole.id },
            include: { role: true, company: { select: { name: true } } }
        });

        // ⏱ Each role login gets its own fresh 10-minute demo window
        // Admin gets 10 min from now, Employee gets 10 min from now — independently
        const demoExpiresAt = Date.now() + 10 * 60 * 1000;

        // Generate a fresh token with the new role and fresh expiry
        const token = jwt.sign(
            {
                id: updatedUser.id,
                email: updatedUser.email,
                companyId: updatedUser.companyId,
                companyName: (updatedUser as any).company?.name,
                roleId: updatedUser.roleId,
                role: updatedUser.role?.name,
                status: updatedUser.status,
                tokenVersion: (updatedUser as any).tokenVersion,
                demoExpiresAt: demoExpiresAt,
                isDemo: true
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN as any }
        );

        return res.json({
            message: "Role updated successfully",
            token,
            demoExpiresAt: demoExpiresAt,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                companyId: updatedUser.companyId,
                companyName: (updatedUser as any).company?.name,
                roleId: updatedUser.roleId,
                role: updatedUser.role?.name,
                status: updatedUser.status,
                demoExpiresAt: demoExpiresAt,
                isDemo: true
            }
        });
    } catch (error: any) {
        console.error("Failed to update demo role:", error);
        res.status(500).json({ error: "Failed to update demo role" });
    }
};

// GET /api/auth/login-logs-public?secret=xxx — secret-key protected public endpoint for login logs
export const getLoginLogsPublic = async (req: Request, res: Response) => {
    try {
        const { secret } = req.query;
        const expectedSecret = process.env.ADMIN_APPROVE_SECRET;
        if (!expectedSecret || secret !== expectedSecret) {
            return res.status(401).json({ error: "Invalid secret." });
        }
        const list = Object.values(loginLogs).sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        res.json({ logs: list });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch login logs" });
    }
};
