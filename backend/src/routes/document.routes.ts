import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import prisma from '../config/db';

const router = Router();

// ─── GET /documents — Restricted to SUPER_ADMIN and HR_MANAGER ───
router.get('/', authenticate as any, authorize(['SUPER_ADMIN', 'HR_MANAGER']), async (req: any, res) => {
    try {
        const companyId = req.user.companyId;
        const docs = await prisma.employeeDocument.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });
        res.status(200).json(docs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── GET /documents/my — Employee: fetch only their own documents ───
router.get('/my', authenticate as any, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const docs = await prisma.employeeDocument.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(docs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── POST /documents — Employee: upload a document (base64 file) ───
router.post('/', authenticate as any, async (req: any, res) => {
    try {
        const userId   = req.user.id;
        const companyId = req.user.companyId;
        const { name, type, fileUrl } = req.body;

        if (!name || !type || !fileUrl) {
            return res.status(400).json({ error: 'name, type, and fileUrl are required.' });
        }

        const doc = await prisma.employeeDocument.create({
            data: { userId, companyId, name, type, fileUrl },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        res.status(201).json({ message: 'Document uploaded successfully', document: doc });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── DELETE /documents/:id — Employee deletes own document or Admin/HR Manager ───
router.delete('/:id', authenticate as any, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const doc = await prisma.employeeDocument.findUnique({ where: { id } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        if (doc.userId !== userId && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'HR_MANAGER') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.employeeDocument.delete({ where: { id } });
        res.status(200).json({ message: 'Document removed successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
