import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import * as configService from '../services/config.service';
import * as auditService from '../services/audit.service';
import * as leaveV2Service from '../services/leave-v2.service';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';


export const getPendingUsers = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const users = await adminService.getPendingUsers(companyId);
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const approveUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        const user = await adminService.approveUser(id, companyId, adminId);
        res.json({ message: 'User approved', user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const rejectUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        const user = await adminService.rejectUser(id, companyId, adminId);
        res.json({ message: 'User rejected', user });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

import cache from '../config/cache';

export const getStats = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const cacheKey = `admin_stats_${companyId}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const stats = await adminService.getDatabaseStats(companyId);
        cache.set(cacheKey, stats, 5); // Cache for 5 seconds (was 300)
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getOverview = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { companyId } = user;
        const role = (user?.role || "").toUpperCase();

        // Roles with access see everything in their company.
        const managerId = undefined;

        const cacheKey = managerId ? `admin_overview_${managerId}_${companyId}` : `admin_overview_${companyId}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const overview = await adminService.getDashboardOverview(companyId, managerId);
        cache.set(cacheKey, overview, 5); // Cache for 5 seconds (was 60)
        res.json(overview);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


export const getRoles = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const roles = await prisma.role.findMany({
            where: {
                OR: [
                    { companyId },
                    { companyId: null } // Global roles
                ]
            }
        });
        res.json(roles);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
        const search = (req.query.search as string || '').trim();
        const actionFilter = (req.query.action as string || '').trim();
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        // Build where clause
        const where: any = { companyId };

        if (actionFilter) {
            where.action = actionFilter;
        }

        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
        }

        // Get total count and paginated logs in parallel
        const [total, logs] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            })
        ]);

        // Get all unique action types for filter dropdown
        const actionTypes = await prisma.auditLog.findMany({
            where: { companyId },
            select: { action: true },
            distinct: ['action'],
            orderBy: { action: 'asc' }
        });

        // Manually join Admin details
        const adminIds = [...new Set(logs.map((log: any) => log.adminId))].filter(Boolean);
        const admins = await prisma.user.findMany({
            where: { id: { in: adminIds as string[] } },
            select: { id: true, name: true, designation: true, department: true }
        });

        const adminMap = new Map(admins.map((a: any) => [a.id, a]));

        const enrichedLogs = logs.map((log: any) => ({
            ...log,
            admin: adminMap.get(log.adminId) || { name: 'System', designation: 'Automated' }
        }));

        res.json({
            logs: enrichedLogs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            actionTypes: actionTypes.map((a: any) => a.action)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


// System Configuration
export const getSettings = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const configs = await configService.getAllConfigs(companyId);
        res.json(configs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const { id: adminId, companyId } = (req as any).user;
        await configService.updateBulkConfigs(req.body, companyId);
        auditService.logAction('SYSTEM_CONFIG_UPDATE', adminId, companyId, 'SYSTEM', `Updated system settings: ${Object.keys(req.body).join(', ')}`);
        res.json({ message: "Settings updated successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Advanced User Control
export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // ACTIVE, SUSPENDED, INACTIVE
        const { id: adminId, companyId } = (req as any).user;

        const user = await prisma.user.update({
            where: { id, companyId },
            data: { status }
        });

        auditService.logAction('USER_STATUS_CHANGE', adminId, companyId, id, `Changed status for ${user.name} to ${status}`);

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const resetUserPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const { id: adminId, companyId } = (req as any).user;

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id, companyId },
            data: { password: hashedPassword }
        });

        auditService.logAction('USER_PASSWORD_RESET', adminId, companyId, id, `Forced password reset for user ID ${id}`);

        res.json({ message: "Password reset successful" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        const user = await prisma.user.findUnique({ where: { id, companyId } });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Prevent deleting yourself
        if (id === adminId) return res.status(400).json({ error: "You cannot delete your own account" });

        // ── Clean up ALL related records to avoid FK constraint errors ──

        // Attendance & Time
        await prisma.attendanceCorrection.deleteMany({ where: { userId: id } });
        await prisma.timeEntry.deleteMany({ where: { userId: id } });
        await prisma.shiftAssignment.deleteMany({ where: { userId: id } });
        await prisma.timesheetEntry.deleteMany({ where: { userId: id } });

        // Leave
        await (prisma as any).leaveBalance.deleteMany({ where: { userId: id } });
        await (prisma as any).leaveRequest.deleteMany({ where: { userId: id } });

        // Payroll & Finance
        await prisma.payslip.deleteMany({ where: { userId: id } });
        await (prisma.salaryConfig as any).deleteMany({ where: { userId: id } });
        await prisma.approvalStep.deleteMany({ where: { approverId: id } });
        await prisma.expenseClaim.deleteMany({ where: { userId: id } });
        await prisma.salaryAdvance.deleteMany({ where: { userId: id } });

        // Performance & Engagement
        await prisma.reviewRating.deleteMany({ where: { review: { userId: id } } });
        await prisma.performanceReview.deleteMany({ where: { userId: id } });
        await prisma.performanceReview.deleteMany({ where: { reviewerId: id } });
        await prisma.wellnessCheck.deleteMany({ where: { userId: id } });
        await prisma.kudos.deleteMany({ where: { OR: [{ fromUserId: id }, { toUserId: id }] } });
        await prisma.pollResponse.deleteMany({ where: { userId: id } });

        // Tickets
        await prisma.ticketComment.deleteMany({ where: { userId: id } });
        await prisma.ticket.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
        await prisma.ticket.deleteMany({ where: { userId: id } });

        // Documents & Notifications
        await prisma.employeeDocument.deleteMany({ where: { userId: id } });
        await prisma.notification.deleteMany({ where: { userId: id } });
        await prisma.onboardingChecklist.deleteMany({ where: { userId: id } });
        await prisma.userTag.deleteMany({ where: { userId: id } });

        // Unassign assets back to the company
        await prisma.asset.updateMany({
            where: { assignedToId: id, companyId },
            data: { assignedToId: null, status: 'AVAILABLE' }
        });

        // Unlink any reports (subordinates) who have this user as manager
        await prisma.user.updateMany({
            where: { managerId: id, companyId },
            data: { managerId: null }
        });

        // Unlink managed departments/branches/designations
        await prisma.department.updateMany({ where: { managerId: id }, data: { managerId: null } });
        await prisma.branch.updateMany({ where: { managerId: id }, data: { managerId: null } });
        await prisma.designation.updateMany({ where: { managerId: id }, data: { managerId: null } });

        // Profile (1-to-1)
        await prisma.profile.deleteMany({ where: { userId: id } });
        await (prisma as any).bankDetails.deleteMany({ where: { userId: id } });
        await (prisma as any).taxDetails.deleteMany({ where: { userId: id } });

        // Finally, delete the user
        await prisma.user.delete({ where: { id, companyId } });

        auditService.logAction('USER_DELETE', adminId, companyId, id, `Permanently deleted user ${user.name} (${user.email})`);

        res.json({ message: "User deleted successfully" });
    } catch (error: any) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: error.message || "Failed to delete user" });
    }
};

export const getSalaryConfig = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { companyId } = (req as any).user;
        const config = await (prisma.salaryConfig as any).findUnique({
            where: { userId: id, companyId }
        });

        if (!config) {
            return res.status(200).json({
                basicSalary: 0,
                hra: 0,
                da: 0,
                bonus: 0,
                otherAllowances: 0,
                pf: 0,
                tax: 0
            });
        }
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSalaryConfig = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        const data = req.body;

        const config = await (prisma.salaryConfig as any).upsert({
            where: { userId: id, companyId },
            update: { ...data, companyId },
            create: { ...data, userId: id, companyId }
        });

        auditService.logAction('SALARY_CONFIG_UPDATE', adminId, companyId, id, `Updated salary configuration for user ${id}`);

        res.json(config);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Phase 3: Admin creates an employee directly
export const createEmployee = async (req: Request, res: Response) => {
    try {
        const { id: adminId, companyId } = (req as any).user;
        if (!companyId) return res.status(401).json({ error: 'Unauthorized: no company found' });

        const { name, email, password, roleId, deptId, designationId, managerId, joiningDate, phone, leaves, employmentType } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });

        // Check duplicate
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);

        // Sanitize FK fields: empty strings → null (prevents FK constraint violations)
        const safeFK = (val: any) => (val && val.trim() !== '') ? val : null;

        const employee = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                companyId,
                roleId: safeFK(roleId),
                deptId: safeFK(deptId),
                designationId: safeFK(designationId),
                managerId: safeFK(managerId),
                phone: phone || null,
                joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
                status: 'ACTIVE',
                emailVerified: true,
                profile: {
                    create: {
                        employmentType: employmentType || "FULL_TIME"
                    }
                }
            },
            include: {
                role: { select: { name: true } },
                department: { select: { name: true } },
                designation: { select: { name: true } },
            }
        });

        auditService.logAction('EMPLOYEE_CREATE', adminId, companyId, employee.id, `Created employee ${name} (${email})`);
        
        // Auto-initialize leave balances based on company policy (with optional overrides)
        await leaveV2Service.initializeBalancesForUser(employee.id, companyId, leaves);

        // Remove password from response
        const { password: _, ...safeEmployee } = employee as any;
        res.status(201).json({ message: 'Employee created successfully', user: safeEmployee });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Update employee details (name, email, phone, status)
export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        const { name, email, phone, status, roleId, deptId, designationId, managerId, employmentType } = req.body;

        // Sanitize FK fields: empty strings → null (prevents FK constraint violations)
        const safeFK = (val: any) => (val && val.trim() !== '') ? val : null;

        const updated = await prisma.user.update({
            where: { id, companyId },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone !== undefined && { phone: phone || null }),
                ...(status && { status }),
                ...(roleId !== undefined && { roleId: safeFK(roleId) }),
                ...(deptId !== undefined && { deptId: safeFK(deptId) }),
                ...(designationId !== undefined && { designationId: safeFK(designationId) }),
                ...(managerId !== undefined && { managerId: safeFK(managerId) }),
                ...(employmentType && {
                    profile: {
                        upsert: {
                            create: { employmentType },
                            update: { employmentType }
                        }
                    }
                })
            },
            include: { role: { select: { name: true } } }
        });

        auditService.logAction('EMPLOYEE_UPDATE', adminId, companyId, id, `Updated employee ${updated.name}`);

        const { password: _, ...safe } = updated as any;
        res.json(safe);
    } catch (error: any) {
        console.error('[Admin] Employee update failed:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get leave balances for a specific employee
export const getEmployeeLeaveBalances = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { companyId } = (req as any).user;

        const balances = await (prisma as any).leaveBalance.findMany({
            where: { userId: id, companyId, year: new Date().getFullYear() },
            include: {
                leaveTypeConfig: { select: { name: true, code: true } }
            }
        });

        res.json(balances);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Update leave balances for a specific employee (HR adjustments)
export const updateEmployeeLeaveBalances = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        const { balances } = req.body; // Array: [{ leaveBalanceId, total }]

        if (!Array.isArray(balances)) {
            return res.status(400).json({ error: 'balances must be an array' });
        }

        const updates = await Promise.all(
            balances.map((b: { id: string; total: number }) =>
                (prisma as any).leaveBalance.update({
                    where: { id: b.id },
                    data: { total: b.total }
                })
            )
        );

        auditService.logAction('LEAVE_BALANCE_UPDATE', adminId, companyId, id, `HR adjusted leave balances for user ${id}`);

        res.json({ message: 'Leave balances updated', updates });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
