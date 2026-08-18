import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import prisma from '../config/db';

const router = Router();

// ─── GET /company-documents — All authenticated users can view ───
router.get('/', authenticate as any, async (req: any, res) => {
    try {
        const companyId = req.user.companyId;
        const docs = await prisma.companyDocument.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(docs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── POST /company-documents — Restricted to SUPER_ADMIN, HR_MANAGER, etc ───
router.post('/', authenticate as any, authorize(['SUPER_ADMIN', 'HR_MANAGER', 'ADMIN']) as any, async (req: any, res) => {
    try {
        const companyId = req.user.companyId;
        const { name, description, type, fileUrl } = req.body;

        if (!name || !fileUrl) {
            return res.status(400).json({ error: 'name and fileUrl are required.' });
        }

        const doc = await prisma.companyDocument.create({
            data: {
                companyId,
                name,
                description,
                type: type || 'General',
                fileUrl,
                uploadedBy: req.user.id
            }
        });

        res.status(201).json({ message: 'Company document uploaded successfully', document: doc });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── DELETE /company-documents/:id — Restricted to SUPER_ADMIN, HR_MANAGER, etc ───
router.delete('/:id', authenticate as any, authorize(['SUPER_ADMIN', 'HR_MANAGER', 'ADMIN']) as any, async (req: any, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const doc = await prisma.companyDocument.findUnique({ where: { id } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        
        if (doc.companyId !== companyId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.companyDocument.delete({ where: { id } });
        res.status(200).json({ message: 'Document removed successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
