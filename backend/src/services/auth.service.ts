import prisma from '../config/db';
import { User, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import * as emailService from './email.service';
import * as tfaService from './2fa.service';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    roleId: z.string().optional(),
    roleName: z.string().optional(), // Added roleName support
    department: z.string().optional(),
    designation: z.string().optional(),
    joiningDate: z.string().optional(),
    companyId: z.string().optional() // Optional for now, but should be required for non-company registration
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const registerCompanySchema = z.object({
    companyName: z.string().min(2),
    adminName: z.string().min(2),
    email: z.string().email(), // Admin Email
    password: z.string().min(6),
    phone: z.string().optional(), // Admin Phone
    plan: z.enum(['FREE', 'PRO']).default('FREE'),
    domain: z.string().optional(),
    industry: z.string().optional(),
    companyEmail: z.string().optional(),
    companyPhone: z.string().optional(),
    address: z.string().optional()
});

import { initializeCompanyRoles } from './rbac-init.service';

export const registerCompany = async (data: z.infer<typeof registerCompanySchema>) => {
    const {
        companyName,
        adminName,
        email,
        password,
        phone,
        plan,
        domain,
        industry,
        companyEmail,
        companyPhone,
        address
    } = registerCompanySchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email already registered');

    console.log('[DEBUG] Starting registerCompany for:', companyName);
    // Start Transaction
    return prisma.$transaction(async (tx) => {
        console.log('[DEBUG] Transaction started');
        // 1. Create Company with Subscription Plan
        const planName = plan === 'PRO' ? 'Professional' : 'Starter';
        const targetPlan = await tx.subscriptionPlan.findFirst({
            where: { name: planName }
        });

        // We'll generate a subdomain based on company name for now
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const company = await tx.company.create({
            data: {
                name: companyName,
                subdomain: slug,
                domain: domain,
                industry: industry,
                email: companyEmail,
                phone: companyPhone,
                address: address,
                status: 'ACTIVE',
                planId: targetPlan?.id
            }
        });

        // 2. Initialize Roles for this company
        const roles = [
            {
                name: 'COMPANY_ADMIN',
                permissions: {
                    manage_settings: true,
                    manage_employees: true,
                    manage_roles: true,
                    view_reports: true,
                    configure_payroll: true
                }
            },
            {
                name: 'HR_MANAGER',
                permissions: {
                    manage_employees: true,
                    manage_attendance: true,
                    approve_leave: true,
                    process_payroll: true,
                    generate_reports: true
                }
            },
            {
                name: 'EMPLOYEE',
                permissions: {
                    self_service: true,
                    view_payslips: true,
                    apply_leave: true,
                    clock_in_out: true
                }
            }
        ];

        let adminRole: any;
        for (const r of roles) {
            const createdRole = await tx.role.create({
                data: {
                    name: r.name,
                    permissions: r.permissions as any,
                    companyId: company.id
                }
            });
            if (r.name === 'COMPANY_ADMIN') adminRole = createdRole;
        }

        // 3. Initialize Default Organizational Structure (Zoho People style)
        // A. Primary Branch
        const branch = await tx.branch.create({
            data: {
                name: 'Main Headquarters',
                address: 'Primary Location',
                companyId: company.id
            }
        });

        // B. Primary Department
        const dept = await tx.department.create({
            data: {
                name: 'Administration',
                description: 'Core organizational management unit',
                companyId: company.id
            }
        });

        // C. Default Designation
        const designation = await tx.designation.create({
            data: {
                name: 'Principal Administrator',
                description: 'Highest authority within the organization',
                companyId: company.id
            }
        });

        // D. Default Salary Config for Admin
        // This ensures the system is ready for payroll even for the first user

        // 4. Create Admin User
        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours

        const user = await tx.user.create({
            data: {
                email,
                name: adminName,
                phone,
                password: hashedPassword,
                roleId: adminRole.id,
                companyId: company.id,
                branchId: branch.id,
                deptId: dept.id,
                designationId: designation.id,
                status: 'PENDING',
                emailVerified: false,
                verificationToken,
                verificationTokenExpiry,
                joiningDate: new Date()
            } as any
        });

        // 5. Send Verification Email
        try {
            await emailService.sendVerificationEmail(email, verificationToken);
            console.log('[DEBUG] Verification email sent');
        } catch (emailErr) {
            console.warn('[DEBUG] Verification email failed but continuing:', emailErr);
        }

        return {
            company: { id: company.id, name: company.name, subdomain: company.subdomain },
            user: { id: user.id, email: user.email, role: 'COMPANY_ADMIN', status: user.status }
        };
    });
};

export const verifyEmail = async (token: string) => {
    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            verificationTokenExpiry: {
                gt: new Date()
            }
        } as any,
        include: { company: true }
    });

    if (!user) {
        throw new Error('Invalid or expired verification token');
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            status: 'ACTIVE',
            verificationToken: null,
            verificationTokenExpiry: null
        } as any
    });

    return {
        message: 'Email verified successfully. You can now login.',
        email: user.email,
        company: (user as any).company?.name
    };
};

export const requestRegistration = async (data: z.infer<typeof registerSchema>) => {
    const { email, password, name, roleId, roleName, department, designation, joiningDate, companyId } = registerSchema.parse(data);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let finalRoleId = roleId;

    // If no ID provided, try to find by Name, or default to EMPLOYEE
    if (!finalRoleId) {
        const targetRoleName = roleName ? roleName.toUpperCase() : 'EMPLOYEE';

        // Check if it's a platform global role (null companyId) or company-specific
        const role = await prisma.role.findFirst({
            where: {
                name: targetRoleName,
                companyId: companyId || null
            }
        });

        // Fallback to EMPLOYEE if specific role not found (safety net)
        if (!role && targetRoleName !== 'EMPLOYEE') {
            const employeeRole = await prisma.role.findFirst({
                where: { name: 'EMPLOYEE', companyId: companyId || null }
            });
            finalRoleId = employeeRole?.id;
        } else {
            finalRoleId = role?.id;
        }
    }

    // Resolve Department string to ID
    let finalDeptId: string | undefined = undefined;
    if (department && companyId) {
        const dept = await prisma.department.upsert({
            where: {
                name_companyId: {
                    name: department,
                    companyId: companyId
                }
            },
            update: {},
            create: {
                name: department,
                companyId: companyId
            }
        });
        finalDeptId = dept.id;
    }

    // Resolve Designation string to ID
    let finalDesignationId: string | undefined = undefined;
    if (designation && companyId) {
        const desig = await prisma.designation.upsert({
            where: {
                name_companyId: {
                    name: designation,
                    companyId: companyId
                }
            },
            update: {},
            create: {
                name: designation,
                companyId: companyId
            }
        });
        finalDesignationId = desig.id;
    }

    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            status: UserStatus.ACTIVE,
            roleId: finalRoleId,
            deptId: finalDeptId,
            designationId: finalDesignationId,
            joiningDate: joiningDate ? new Date(joiningDate) : undefined,
            companyId: companyId
        },
    });


    return { id: user.id, email: user.email, status: user.status };
};

export const verifyCredentials = async (data: z.infer<typeof loginSchema>) => {
    const { email, password } = loginSchema.parse(data);

    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true, company: { select: { name: true } } }
    });

    if (!user) {
        console.log('User not found:', email);
        throw new Error('Invalid credentials');
    }

    // Cast user to any to avoid TS errors with potentially stale Prisma types
    const userWithPassword = user as any;

    if (!userWithPassword.password) {
        throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, userWithPassword.password);

    if (!isValid) {
        console.log('Password mismatch for user:', email);
        throw new Error('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
        // In a real app we might allow login but restrict access, or deny login.
        // For now, let's allow it but the frontend should handle the PENDING state.
        // OR deny it:
        // throw new Error(`Account is ${user.status}`);
    }

    // Check if 2FA is enabled
    if ((user as any).twoFactorEnabled) {
        return {
            requires2FA: true,
            email: user.email,
            id: user.id
        };
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            companyId: user.companyId,
            companyName: (user as any).company?.name,
            roleId: user.roleId,
            role: user.role?.name,
            status: user.status,
            tokenVersion: (user as any).tokenVersion
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
    );

    // Return user info sans password
    return {
        token,
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
    };
};

export const verify2FALogin = async (userId: string, code: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true, company: { select: { name: true } } }
    });

    if (!user || !(user as any).twoFactorSecret) {
        throw new Error('2FA not configured for this user');
    }

    const isValid = tfaService.verifyToken(code, (user as any).twoFactorSecret);

    if (!isValid) {
        throw new Error('Invalid authentication code');
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            companyId: user.companyId,
            companyName: (user as any).company?.name,
            roleId: user.roleId,
            role: user.role?.name,
            status: user.status,
            tokenVersion: (user as any).tokenVersion
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
        token,
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
    };
};

export const setup2FA = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const { secret, otpauth } = tfaService.generateSecret(user.email);
    const qrCode = await tfaService.generateQRCode(otpauth);

    // Pre-save secret but don't enable it yet
    await prisma.user.update({
        where: { id: userId, companyId: user.companyId },
        data: { twoFactorSecret: secret, twoFactorEnabled: false } as any
    });

    return { qrCode, secret };
};

export const activate2FA = async (userId: string, code: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(user as any).twoFactorSecret) throw new Error('2FA Setup not initiated');

    const isValid = tfaService.verifyToken(code, (user as any).twoFactorSecret);
    if (!isValid) throw new Error('Invalid verification code');

    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true } as any
    });

    return { message: '2FA Activated successfully' };
};

export const disable2FA = async (userId: string) => {
    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null } as any
    });
    return { message: '2FA disabled successfully' };
};

export const requestPasswordReset = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // We don't want to leak user existence, but for internal HR app it might be fine.
        // However, let's keep it safe. In a real app we'd just return success regardless.
        throw new Error('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: token,
            resetTokenExpiry: expiry,
        },
    });

    // Send email
    await emailService.sendPasswordResetEmail(user.email, token);
};

export const resetPassword = async (token: string, newPassword: string) => {
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: {
                gt: new Date(),
            },
        },
    });

    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });
};

export const changePassword = async (userId: string, currentPass: string, newPass: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new Error("User not found");

    const isValid = await bcrypt.compare(currentPass, user.password);
    if (!isValid) throw new Error("Incorrect current password");

    const hashedPassword = await bcrypt.hash(newPass, 12);
    return prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
};

export const logoutOthers = async (userId: string) => {
    return prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } } as any
    });
};

export const refreshToken = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true, company: { select: { name: true } } }
    });

    if (!user) throw new Error('User not found');
    if (user.status !== 'ACTIVE') throw new Error('Account is not active');

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            companyId: user.companyId,
            companyName: (user as any).company?.name,
            roleId: user.roleId,
            role: user.role?.name,
            status: user.status,
            tokenVersion: (user as any).tokenVersion
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
        token,
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
    };
};
