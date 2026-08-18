import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import prisma from '../config/db';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { id: loggedInUserId, companyId } = (req as any).user;
        const { page, limit, search, status } = req.query;
        let managerId: string | undefined = undefined;

        if (loggedInUserId) {
            const user = await prisma.user.findFirst({
                where: { id: loggedInUserId, companyId },
                include: { role: true }
            });
            if (user?.role?.name === 'MANAGER') {
                managerId = user.id;
            }
        }

        const result = await userService.getAllUsers({
            companyId,
            page: page ? parseInt(page as string) : undefined,
            limit: limit === 'ALL' ? 'ALL' : (limit ? parseInt(limit as string) : undefined) as any,
            search: search as string,
            status: status as string,
            managerId
        });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { companyId } = (req as any).user;
        const data = req.body;
        const user = await userService.updateUser(id, companyId, data);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const user = await userService.getUserById(userId, companyId);
        res.json(user);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

export const getUserByIdHR = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const { id } = req.params;
        const user = await userService.getUserById(id, companyId);
        res.json(user);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const user = await userService.updateProfile(userId, companyId, req.body);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateAvatar = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const { avatarUrl } = req.body;
        const user = await userService.updateAvatar(userId, companyId, avatarUrl);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        await userService.deleteUser(userId, companyId);
        res.json({ message: 'Account deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const exportData = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const data = await userService.exportPersonalData(userId, companyId);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const docs = await userService.getDocuments(userId, companyId);
        res.json(docs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const doc = await userService.uploadDocument(userId, companyId, req.body);
        res.status(201).json(doc);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const { id: docId } = req.params;
        await userService.deleteDocument(docId, userId, companyId);
        res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getUserDocumentsHR = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const { id: employeeId } = req.params;
        const docs = await userService.getUserDocumentsHR(employeeId, companyId);
        res.json(docs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
