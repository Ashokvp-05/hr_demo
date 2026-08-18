import prisma from '../config/db';
import cache from '../config/cache';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { AppError } from '../middleware/error.middleware';

export const createShift = async (companyId: string, data: { name: string, startTime: string, endTime: string, workDays: number[] }) => {
    return (prisma as any).shift.create({
        data: {
            ...data,
            companyId
        }
    });
};

export const getShifts = async (companyId: string) => {
    return (prisma as any).shift.findMany({
        where: { companyId }
    });
};

export const assignShift = async (companyId: string, userId: string, shiftId: string, startDate: Date, endDate?: Date) => {
    return (prisma as any).shiftAssignment.create({
        data: {
            userId,
            shiftId,
            companyId,
            startDate,
            endDate
        }
    });
};

export const getUserShiftForDate = async (userId: string, companyId: string, date: Date) => {
    const assignment = await (prisma as any).shiftAssignment.findFirst({
        where: {
            userId,
            companyId,
            startDate: { lte: date },
            OR: [
                { endDate: null },
                { endDate: { gte: date } }
            ]
        },
        include: { shift: true }
    });

    return assignment?.shift || null;
};

export const clockInV2 = async (userId: string, companyId: string, location?: { lat: number, lng: number, workLocation?: string }, type: any = 'IN_OFFICE') => {
    // Check if there's already an active entry
    const activeEntry = await prisma.timeEntry.findFirst({
        where: { userId, companyId, status: 'ACTIVE' }
    });

    if (activeEntry) throw new AppError('Already clocked in', 400);
    
    // Invalidate dashboard cache
    cache.del(`dashboard_data_${userId}`);

    return (prisma as any).timeEntry.create({
        data: {
            userId,
            companyId,
            clockIn: new Date(),
            clockType: type,
            status: 'ACTIVE',
            lat: location?.lat,
            lng: location?.lng,
            location: location || {}
        }
    });
};

export const clockOutV2 = async (userId: string, companyId: string) => {
    // Find the current active session
    const activeEntry = await prisma.timeEntry.findFirst({
        where: { userId, companyId, status: 'ACTIVE' }
    });

    if (!activeEntry) {
        throw new AppError('No active session found. Please refresh the dashboard.', 404);
    }

    const clockOut = new Date();
    const diff = clockOut.getTime() - activeEntry.clockIn.getTime();
    const hoursWorked = Number((diff / (1000 * 60 * 60)).toFixed(2));
    
    // Invalidate dashboard cache
    cache.del(`dashboard_data_${userId}`);

    return prisma.timeEntry.update({
        where: { id: activeEntry.id },
        data: {
            clockOut,
            hoursWorked,
            status: 'COMPLETED'
        }
    });
};

export const requestCorrection = async (userId: string, companyId: string, timeEntryId: string, data: { requestedClockIn?: Date, requestedClockOut?: Date, reason: string }) => {
    return (prisma as any).attendanceCorrection.create({
        data: {
            ...data,
            userId,
            companyId,
            timeEntryId,
            status: 'PENDING'
        }
    });
};

export const approveCorrection = async (correctionId: string, companyId: string, approvedBy: string) => {
    const correction = await (prisma as any).attendanceCorrection.findUnique({
        where: { id: correctionId, companyId }
    });

    if (!correction) throw new Error('Correction request not found');

    return prisma.$transaction(async (tx) => {
        // Update the time entry
        await tx.timeEntry.update({
            where: { id: correction.timeEntryId },
            data: {
                clockIn: correction.requestedClockIn || undefined,
                clockOut: correction.requestedClockOut || undefined
            }
        });

        // Approve the correction
        return (tx as any).attendanceCorrection.update({
            where: { id: correctionId },
            data: {
                status: 'APPROVED',
                approvedBy
            }
        });
    });
};
