import prisma from '../config/db';

export const createProject = async (companyId: string, data: any) => {
    return prisma.project.create({
        data: {
            ...data,
            companyId
        }
    });
};

export const getProjects = async (companyId: string) => {
    return prisma.project.findMany({
        where: { companyId },
        include: { tasks: true, _count: { select: { timesheets: true } } }
    });
};

export const createTimesheet = async (userId: string, companyId: string, data: any) => {
    return prisma.timesheetEntry.create({
        data: {
            ...data,
            userId,
            companyId
        }
    });
};

export const getMyTimesheets = async (userId: string) => {
    return prisma.timesheetEntry.findMany({
        where: { userId },
        include: { project: true, task: true }
    });
};
