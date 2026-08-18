import prisma from '../config/db';

export const getConfig = async (key: string, companyId?: string) => {
    const config = await prisma.systemConfig.findFirst({
        where: { key, companyId: companyId || null }
    });
    return config?.value;
};

export const setConfig = async (key: string, value: any, companyId?: string) => {
    const compId = companyId || null;
    const existing = await prisma.systemConfig.findFirst({
        where: { key, companyId: compId }
    });

    if (existing) {
        return prisma.systemConfig.update({
            where: { id: existing.id },
            data: { value }
        });
    } else {
        return prisma.systemConfig.create({
            data: { key, value, companyId: compId }
        });
    }
};

export const getAllConfigs = async (companyId?: string) => {
    const configs = await prisma.systemConfig.findMany({
        where: { companyId: companyId || null }
    });
    return configs.reduce((acc: any, config) => {
        acc[config.key] = config.value;
        return acc;
    }, {});
};

export const updateBulkConfigs = async (data: Record<string, any>, companyId?: string) => {
    const compId = companyId || null;
    const operations = Object.entries(data).map(async ([key, value]) => {
        const existing = await prisma.systemConfig.findFirst({
            where: { key, companyId: compId }
        });
        if (existing) {
            return prisma.systemConfig.update({
                where: { id: existing.id },
                data: { value }
            });
        } else {
            return prisma.systemConfig.create({
                data: { key, value, companyId: compId }
            });
        }
    });
    return Promise.all(operations);
};
