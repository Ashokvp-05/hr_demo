import { Request, Response } from 'express';
import { seedDemoData } from '../scripts/seed-demo';
import prisma from '../config/db';

/** POST /api/demo/reset?secret=xxx — Re-seeds all demo data */
export const resetDemoData = async (req: Request, res: Response) => {
    try {
        const { secret } = req.query;
        const expectedSecret = process.env.ADMIN_APPROVE_SECRET;
        if (!expectedSecret || secret !== expectedSecret) {
            return res.status(401).json({ error: 'Invalid secret.' });
        }
        const result = await seedDemoData();
        res.json({ message: 'Demo data seeded successfully', ...result });
    } catch (error: any) {
        console.error('[DEMO RESET] Error:', error);
        res.status(500).json({ error: error.message || 'Seed failed' });
    }
};

/** GET /api/demo/status — Returns current demo data counts */
export const getDemoStatus = async (req: Request, res: Response) => {
    try {
        const company = await prisma.company.findFirst();
        if (!company) return res.json({ seeded: false, message: 'No company found' });

        const [employees, attendance, leaves, payslips, kudos, announcements] = await Promise.all([
            prisma.user.count({ where: { companyId: company.id } }),
            prisma.timeEntry.count({ where: { companyId: company.id } }),
            prisma.leaveRequest.count({ where: { companyId: company.id } }),
            prisma.payslip.count({ where: { companyId: company.id } }),
            prisma.kudos.count({ where: { companyId: company.id } }),
            prisma.announcement.count({ where: { companyId: company.id } }),
        ]);

        res.json({
            seeded: employees > 0,
            company: company.name,
            counts: { employees, attendance, leaves, payslips, kudos, announcements }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
