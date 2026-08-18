import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = [
    {
        name: 'SUPER_ADMIN',
        permissions: {
            canManageUsers: true,
            canApproveLeaves: true,
            canEditAttendance: true,
            canExportReports: true,
            canConfigureSystem: true,
            canViewAuditLogs: true,
            canManageAdmins: true
        }
    },
    {
        name: 'HR_ADMIN',
        permissions: {
            canManageUsers: true, // Add/Remove Users, Edit Profiles
            canApproveLeaves: true,
            canEditAttendance: true,
            canExportReports: true,
            canConfigureSystem: false,
            canViewAuditLogs: false
        }
    },
    {
        name: 'HR',
        permissions: {
            canManageUsers: true,
            canApproveLeaves: true,
            canEditAttendance: true,
            canExportReports: true,
            canConfigureSystem: false,
            canViewAuditLogs: false
        }
    },
    {
        name: 'OPS_ADMIN', // Operations
        permissions: {
            canManageUsers: false,
            canApproveLeaves: false, // Wait, req says "Approve attendance corrections", maybe not leaves? Req says "Approve attendance corrections"
            canEditAttendance: true,
            canExportReports: true,
            canConfigureSystem: false,
            canViewAuditLogs: false
        }
    },
    {
        name: 'FINANCE_ADMIN',
        permissions: {
            canManageUsers: false,
            canApproveLeaves: false,
            canEditAttendance: false,
            canExportReports: true, // Payroll data
            canConfigureSystem: false,
            canViewAuditLogs: false
        }
    },
    {
        name: 'SUPPORT_ADMIN',
        permissions: {
            canManageUsers: false, // Reset passwords only usually, but let's say "manage sessions"
            canApproveLeaves: false,
            canEditAttendance: false,
            canExportReports: false,
            canConfigureSystem: false,
            canViewAuditLogs: true // View audit logs
        }
    },
    {
        name: 'VIEWER_ADMIN', // Read-Only
        permissions: {
            canManageUsers: false,
            canApproveLeaves: false,
            canEditAttendance: false,
            canExportReports: false, // "View reports" only, maybe strict export? Req says "No edit permissions"
            canConfigureSystem: false,
            canViewAuditLogs: true
        }
    },
    {
        name: 'EMPLOYEE',
        permissions: {
            canManageUsers: false,
            canApproveLeaves: false,
            canEditAttendance: false,
            canExportReports: false,
            canConfigureSystem: false,
            canViewAuditLogs: false
        }
    }
];

async function main() {
    console.log('Seeding Roles...');

    for (const role of ROLES) {
        const upsertedRole = await prisma.role.upsert({
            where: { name: role.name },
            update: { permissions: role.permissions },
            create: {
                name: role.name,
                permissions: role.permissions
            }
        });
        console.log(`Role upserted: ${upsertedRole.name}`);
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
