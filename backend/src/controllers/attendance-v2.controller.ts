import { Request, Response } from 'express';
import * as attendanceV2Service from '../services/attendance-v2.service';
import * as auditService from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { triggerDashboardUpdate } from '../services/websocket.service';

export const createShift = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.companyId) throw new Error('Unauthorized');
        const shift = await attendanceV2Service.createShift(user.companyId, req.body);
        auditService.logAction('SHIFT_CREATE', user.id, user.companyId, shift.id, `Created shift ${req.body.name}`);
        res.status(201).json(shift);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getShifts = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.companyId) throw new Error('Unauthorized');
        const shifts = await attendanceV2Service.getShifts(user.companyId);
        res.status(200).json(shifts);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const assignShift = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.companyId) throw new Error('Unauthorized');
        const { userId, shiftId, startDate, endDate } = req.body;
        const assignment = await attendanceV2Service.assignShift(user.companyId, userId, shiftId, new Date(startDate), endDate ? new Date(endDate) : undefined);
        auditService.logAction('SHIFT_ASSIGN', user.id, user.companyId, assignment.id, `Assigned shift to user ${userId}`);
        res.status(201).json(assignment);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
export const clockIn = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.id || !user?.companyId) throw new Error('Unauthorized');
        const { lat, lng, type, workLocation } = req.body;
        const entry = await attendanceV2Service.clockInV2(user.id, user.companyId, { lat, lng, workLocation }, type || 'IN_OFFICE');
        auditService.logAction('CLOCK_IN', user.id, user.companyId, entry.id, `Clocked in (${type || 'IN_OFFICE'})`);
        triggerDashboardUpdate();
        res.status(201).json(entry);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const clockOut = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.id || !user?.companyId) throw new Error('Unauthorized');
        const entry = await attendanceV2Service.clockOutV2(user.id, user.companyId);
        auditService.logAction('CLOCK_OUT', user.id, user.companyId, entry.id, `Clocked out`);
        triggerDashboardUpdate();
        res.status(200).json(entry);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const requestCorrection = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user?.id || !user?.companyId) throw new Error('Unauthorized');
        const { timeEntryId, requestedClockIn, requestedClockOut, reason } = req.body;
        const correction = await attendanceV2Service.requestCorrection(user.id, user.companyId, timeEntryId, { requestedClockIn, requestedClockOut, reason });
        auditService.logAction('ATTENDANCE_CORRECTION', user.id, user.companyId, correction.id, `Requested attendance correction: ${reason}`);
        res.status(201).json(correction);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
