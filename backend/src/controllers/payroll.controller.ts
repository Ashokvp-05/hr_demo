
import { Request, Response } from 'express';
import * as payrollService from '../services/payroll.service';
import * as auditService from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const createBatch = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const batch = await payrollService.createPayrollBatch(user.companyId, month, year, user.id);
        auditService.logAction('PAYROLL_BATCH_CREATE', user.id, user.companyId, batch.id, `Created payroll batch for ${month} ${year}`);
        res.status(201).json(batch);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const generatePayslips = async (req: Request, res: Response) => {
    try {
        const { batchId } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const payslips = await payrollService.generatePayslipsForBatch(batchId, user.companyId);
        auditService.logAction('PAYROLL_GENERATE', user.id!, user.companyId, batchId, `Generated ${payslips.length} payslips for batch`);
        res.status(200).json({ message: "Payslips generated successfully", count: payslips.length });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateBatchStatus = async (req: Request, res: Response) => {
    try {
        const { batchId } = req.params;
        const { status } = req.body;
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const batch = await payrollService.updateBatchStatus(batchId, user.companyId, status, user.id);
        auditService.logAction('PAYROLL_STATUS_UPDATE', user.id, user.companyId, batchId, `Updated payroll batch status to ${status}`);
        res.status(200).json(batch);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getBatch = async (req: Request, res: Response) => {
    try {
        const { batchId } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const batch = await payrollService.getBatchDetails(batchId, user.companyId);
        res.status(200).json(batch);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllBatches = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const batches = await payrollService.getAllBatches(user.companyId);
        res.status(200).json(batches);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getMyPayslips = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.id || !user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const payslips = await payrollService.getMyPayslips(user.id, user.companyId);
        res.status(200).json(payslips);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const stats = await payrollService.getPayrollDashboardStats(user.companyId);
        res.status(200).json(stats);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSalaryConfig = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const config = await payrollService.getSalaryConfig(userId, user.companyId);
        res.status(200).json(config);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSalaryConfig = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const config = await payrollService.updateSalaryConfig(userId, user.companyId, req.body);
        res.status(200).json(config);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getBankDetails = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const details = await payrollService.getBankDetails(userId, user.companyId);
        res.status(200).json(details);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateBankDetails = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const details = await payrollService.updateBankDetails(userId, user.companyId, req.body);
        res.status(200).json(details);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getTaxDetails = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const details = await payrollService.getTaxDetails(userId, user.companyId);
        res.status(200).json(details);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateTaxDetails = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = (req as AuthRequest).user;
        if (!user?.companyId) return res.status(401).json({ error: 'Unauthorized' });

        const details = await payrollService.updateTaxDetails(userId, user.companyId, req.body);
        res.status(200).json(details);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
