import { Request, Response } from 'express';
import * as payslipService from '../services/payslip.service';
import * as auditService from '../services/audit.service';

export const uploadPayslip = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { userId, month, year, amount } = req.body;

        if (!userId || !month || !year || !amount) {
            return res.status(400).json({ error: "Missing required fields: userId, month, year, amount" });
        }

        const adminId = (req as any).user.id;
        const companyId = (req as any).user.companyId;

        const payslip = await payslipService.uploadPayslip(
            userId,
            month,
            parseInt(year),
            parseFloat(amount),
            req.file.buffer,
            req.file.originalname,
            companyId
        );
        auditService.logAction('PAYSLIP_UPLOAD', adminId, payslip.id, `Uploaded payslip for User ${userId}`);

        res.status(201).json(payslip);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const downloadPayslip = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const requesterId = (req as any).user.id;
        const role = (req as any).user.role; // From JWT

        const { path: filePath, filename, url } = await payslipService.getPayslipFile(id, requesterId, role);

        auditService.logAction('PAYSLIP_DOWNLOAD', requesterId, id, `Downloaded payslip`);

        if (url) {
            return res.redirect(url);
        }
        res.download(filePath, filename);
    } catch (error: any) {
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(404).json({ error: error.message });
    }
};

export const getMyPayslips = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const payslips = await payslipService.getMyPayslips(userId, companyId);
        res.json(payslips);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllPayslips = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const { year, month, status, userId: targetUserId } = req.query;
        const payslips = await payslipService.getAllPayslips(
            companyId,
            year ? parseInt(year as string) : undefined,
            month as string,
            status as string,
            targetUserId as string
        );
        res.json(payslips);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const releasePayslip = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        const payslip = await payslipService.releasePayslip(id, companyId);

        auditService.logAction('PAYSLIP_RELEASE', adminId, id, `Released payslip for User ${payslip.userId}`);

        res.json(payslip);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const generatePayslip = async (req: Request, res: Response) => {
    try {
        const { userId, month, year, amount, hra, da, bonus, otherAllowances, pf, tax } = req.body;
        const { id: adminId, companyId } = (req as any).user;

        if (!userId || !month || !year || amount === undefined) {
            return res.status(400).json({ error: "Missing required fields: salary amount must be established" });
        }

        const payslip = await payslipService.generatePayslipFromTemplate(
            userId,
            month,
            parseInt(year),
            parseFloat(amount),
            {
                hra: hra ? parseFloat(hra) : 0,
                da: da ? parseFloat(da) : 0,
                bonus: bonus ? parseFloat(bonus) : 0,
                otherAllowances: otherAllowances ? parseFloat(otherAllowances) : 0,
                pf: pf ? parseFloat(pf) : 0,
                tax: tax ? parseFloat(tax) : 0
            }
        );

        auditService.logAction('PAYSLIP_GENERATE', adminId, payslip.id, `Generated template payslip for User ${userId}`);

        res.status(201).json(payslip);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const bulkRelease = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        const { id: adminId, companyId } = (req as any).user;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No IDs provided" });
        }

        const result = await payslipService.bulkUpdateStatus(ids, companyId, 'RELEASED' as any);

        auditService.logAction('PAYSLIP_BULK_RELEASE', adminId, 'BULK', `Released ${result.count} payslips`);

        res.json({ message: `Successfully released ${result.count} payslips`, count: result.count });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePayslip = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        await payslipService.deletePayslip(id, companyId);

        auditService.logAction('PAYSLIP_DELETE', adminId, id, `Deleted payslip ${id}`);

        res.json({ message: "Payslip deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePayslip = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: adminId, companyId } = (req as any).user;
        const payslip = await payslipService.updatePayslip(id, companyId, req.body);

        auditService.logAction('PAYSLIP_UPDATE', adminId, id, `Updated payslip ${id}`);

        res.json(payslip);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
