import prisma from '../config/db';

export const getDepartments = async (companyId: string) => {
    return (prisma as any).department.findMany({
        where: { companyId },
        include: { 
            manager: { select: { id: true, name: true } }, 
            parent: { select: { id: true, name: true } },
            _count: { select: { users: true } } 
        }
    });
};

export const createDepartment = async (companyId: string, data: { name: string, description?: string, managerId?: string, parentId?: string, status?: string }) => {
    return (prisma as any).department.create({
        data: {
            ...data,
            companyId
        }
    });
};

export const updateDepartment = async (id: string, companyId: string, data: any) => {
    return (prisma as any).department.update({
        where: { id, companyId },
        data
    });
};

export const deleteDepartment = async (id: string, companyId: string) => {
    return (prisma as any).department.delete({
        where: { id, companyId }
    });
};

export const getDesignations = async (companyId: string) => {
    return (prisma as any).designation.findMany({
        where: { companyId },
        include: { 
            manager: { select: { id: true, name: true } },
            _count: { select: { users: true } } 
        }
    });
};

export const createDesignation = async (companyId: string, data: { name: string, description?: string, managerId?: string, status?: string }) => {
    return (prisma as any).designation.create({
        data: {
            ...data,
            companyId
        }
    });
};

export const getBranches = async (companyId: string) => {
    return (prisma as any).branch.findMany({
        where: { companyId },
        include: { 
            manager: { select: { id: true, name: true } },
            _count: { select: { users: true } } 
        }
    });
};

export const createBranch = async (companyId: string, data: { name: string, address?: string, city?: string, managerId?: string, status?: string }) => {
    return (prisma as any).branch.create({
        data: {
            ...data,
            companyId
        }
    });
};

export const getOrganizationStats = async (companyId: string) => {
    const [departments, designations, branches, users, roles] = await Promise.all([
        (prisma as any).department.count({ where: { companyId } }),
        (prisma as any).designation.count({ where: { companyId } }),
        (prisma as any).branch.count({ where: { companyId } }),
        prisma.user.count({ where: { companyId, status: 'ACTIVE' } }),
        (prisma as any).role.count({ where: { companyId } })
    ]);

    return {
        departments,
        designations,
        branches,
        roles,
        activeEmployees: users
    };
};

export const getRoles = async (companyId: string) => {
    return (prisma as any).role.findMany({
        where: { companyId },
        include: { _count: { select: { users: true } } }
    });
};

export const createRole = async (companyId: string, data: { name: string, description?: string }) => {
    return (prisma as any).role.create({
        data: {
            name: data.name,
            permissions: {}, // Default empty permissions
            companyId
        }
    });
};
