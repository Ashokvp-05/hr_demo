import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

const router = express.Router();

const SKILLS_KEY = 'EMPLOYEE_SKILLS_MATRIX';

// GET all skills for the company
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID required' });

        const config = await prisma.systemConfig.findUnique({
            where: { key_companyId: { key: SKILLS_KEY, companyId } }
        });

        const skills = config?.value ? (config.value as any[]) : [];
        res.json(skills);
    } catch (error: any) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// POST — add a new skill entry
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'COMPANY_ADMIN']), async (req: AuthRequest, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID required' });

        const newSkill = {
            id: crypto.randomUUID(),
            ...req.body,
            createdAt: new Date().toISOString()
        };

        const config = await prisma.systemConfig.findUnique({
            where: { key_companyId: { key: SKILLS_KEY, companyId } }
        });

        const skills = config?.value ? (config.value as any[]) : [];
        skills.push(newSkill);

        await prisma.systemConfig.upsert({
            where: { key_companyId: { key: SKILLS_KEY, companyId } },
            update: { value: skills },
            create: { key: SKILLS_KEY, companyId, value: skills }
        });

        res.status(201).json(newSkill);
    } catch (error: any) {
        console.error('Error creating skill:', error);
        res.status(500).json({ error: 'Failed to create skill entry' });
    }
});

// PUT — update a skill entry by ID
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'COMPANY_ADMIN']), async (req: AuthRequest, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID required' });
        const { id } = req.params;

        const config = await prisma.systemConfig.findUnique({
            where: { key_companyId: { key: SKILLS_KEY, companyId } }
        });

        let skills = config?.value ? (config.value as any[]) : [];
        const idx = skills.findIndex((s: any) => s.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Skill entry not found' });

        skills[idx] = { ...skills[idx], ...req.body, updatedAt: new Date().toISOString() };

        await prisma.systemConfig.upsert({
            where: { key_companyId: { key: SKILLS_KEY, companyId } },
            update: { value: skills },
            create: { key: SKILLS_KEY, companyId, value: skills }
        });

        res.json(skills[idx]);
    } catch (error: any) {
        console.error('Error updating skill:', error);
        res.status(500).json({ error: 'Failed to update skill entry' });
    }
});

// DELETE — remove a skill entry by ID
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'COMPANY_ADMIN']), async (req: AuthRequest, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID required' });
        const { id } = req.params;

        const config = await prisma.systemConfig.findUnique({
            where: { key_companyId: { key: SKILLS_KEY, companyId } }
        });

        let skills = config?.value ? (config.value as any[]) : [];
        skills = skills.filter((s: any) => s.id !== id);

        await prisma.systemConfig.upsert({
            where: { key_companyId: { key: SKILLS_KEY, companyId } },
            update: { value: skills },
            create: { key: SKILLS_KEY, companyId, value: skills }
        });

        res.json({ message: 'Skill entry deleted' });
    } catch (error: any) {
        console.error('Error deleting skill:', error);
        res.status(500).json({ error: 'Failed to delete skill entry' });
    }
});

export default router;
