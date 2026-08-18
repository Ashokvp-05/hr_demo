import { Request, Response } from 'express';
import * as kudosService from '../services/kudos.service';

export const giveKudos = async (req: Request, res: Response) => {
    try {
        const { id: fromUserId, companyId } = (req as any).user;
        const { toUserId, message, category } = req.body;

        const kudos = await kudosService.giveKudos(fromUserId, toUserId, companyId || "", message, category);
        res.json(kudos);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getReceivedKudos = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const kudos = await kudosService.getReceivedKudos(userId, companyId || "");
        res.json(kudos);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getGivenKudos = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as any).user;
        const kudos = await kudosService.getGivenKudos(userId, companyId || "");
        res.json(kudos);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCompanyFeed = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const feed = await kudosService.getCompanyKudosFeed(companyId || "");
        res.json(feed);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as any).user;
        const analytics = await kudosService.getKudosAnalytics(companyId || "");
        res.json(analytics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
