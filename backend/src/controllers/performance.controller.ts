import { Request, Response } from 'express';
import * as performanceService from '../services/performance.service';
import * as auditService from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const createKPI = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as AuthRequest).user!;
        const { name, description, weight } = req.body;
        const kpi = await performanceService.createKPI(companyId, name, description, weight);
        auditService.logAction('KPI_CREATE', (req as AuthRequest).user!.id, companyId, kpi.id, `Created KPI: ${name}`);
        res.json(kpi);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getKPIs = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as AuthRequest).user!;
        const kpis = await performanceService.getCompanyKPIs(companyId);
        res.json(kpis);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const submitReview = async (req: Request, res: Response) => {
    try {
        const { id: reviewerId, companyId } = (req as AuthRequest).user!;
        const { userId, reviewCycle, ratings, comments, asDraft } = req.body;
        const review = await performanceService.createPerformanceReview(
            userId, companyId, reviewerId, reviewCycle, ratings, comments, asDraft
        );
        auditService.logAction('REVIEW_SUBMIT', reviewerId, companyId, review.id, `Submitted performance review for user ${userId} (${reviewCycle})`);
        res.json(review);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateReviewStatus = async (req: Request, res: Response) => {
    try {
        const { id: reviewId } = req.params;
        const { companyId } = (req as AuthRequest).user!;
        const { status, hrComments } = req.body;
        const updated = await performanceService.advanceReviewStatus(reviewId, companyId, status, hrComments);
        auditService.logAction('REVIEW_STATUS_UPDATE', (req as AuthRequest).user!.id, companyId, reviewId, `Updated review status to ${status}`);
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getMyReviews = async (req: Request, res: Response) => {
    try {
        const { id: userId, companyId } = (req as AuthRequest).user!;
        const reviews = await performanceService.getUserReviews(userId, companyId);
        res.json(reviews);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getTeamPerformance = async (req: Request, res: Response) => {
    try {
        const { id: managerId, companyId } = (req as AuthRequest).user!;
        const reviews = await performanceService.getTeamReviews(managerId, companyId);
        res.json(reviews);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllReviews = async (req: Request, res: Response) => {
    try {
        const { companyId } = (req as AuthRequest).user!;
        const { status } = req.query;
        const reviews = await performanceService.getCompanyReviews(companyId, status as any);
        res.json(reviews);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
