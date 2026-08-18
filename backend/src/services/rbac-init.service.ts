import prisma from '../config/db';

export const initializeCompanyRoles = async (companyId: string) => {
    const roles = [
        {
            name: 'COMPANY_ADMIN',
            permissions: {
                manage_settings: true,
                manage_employees: true,
                manage_roles: true,
                view_reports: true,
                configure_payroll: true
            },
            companyId,
        },
        {
            name: 'HR_MANAGER',
            permissions: {
                manage_employees: true,
                manage_attendance: true,
                approve_leave: true,
                process_payroll: true,
                generate_reports: true
            },
            companyId,
        },
        {
            name: 'EMPLOYEE',
            permissions: {
                self_service: true,
                view_payslips: true,
                apply_leave: true,
                clock_in_out: true
            },
            companyId,
        },
        {
            name: 'PAYROLL_ADMIN',
            permissions: {
                manage_payroll: true,
                view_salary_structures: true,
                process_batch: true,
                generate_payslip: true
            },
            companyId,
        },
        {
            name: 'SUPPORT_ADMIN',
            permissions: {
                manage_tickets: true,
                view_all_tickets: true,
                assign_tickets: true,
                resolve_tickets: true,
                system_monitoring: true
            },
            companyId,
        },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: {
                name_companyId: {
                    name: role.name,
                    companyId: role.companyId
                }
            },
            update: {},
            create: role
        });
    }

    // Return the COMPANY_ADMIN role as it's needed for the owner
    return prisma.role.findUnique({
        where: {
            name_companyId: {
                name: 'COMPANY_ADMIN',
                companyId
            }
        }
    });
};
