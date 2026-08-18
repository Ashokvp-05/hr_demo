import prisma from '../config/db';
import { ReviewStatus } from '@prisma/client';
import { createNotification } from './notification.service';
import cache from '../config/cache';

export const createKPI = async (companyId: string, name: string, description: string, weight: number) => {
    return (prisma as any).performanceKPI.create({
        data: { companyId, name, description, weight }
    });
};

export const getCompanyKPIs = async (companyId: string) => {
    return (prisma as any).performanceKPI.findMany({ where: { companyId } });
};

/**
 * STAGE 1: Employee/Manager submits a review in DRAFT or SUBMITTED state.
 * - If submitterId === userId → self-evaluation (SUBMITTED status)
 * - If submitterId is manager → manager evaluation (SUBMITTED)
 * - Both can be saved as DRAFT first
 */
export const createPerformanceReview = async (
    userId: string,
    companyId: string,
    reviewerId: string,
    reviewCycle: string,
    ratings: any[],
    overallComments: string,
    asDraft: boolean = false
) => {
    const totalWeight = ratings.reduce((acc, r) => acc + (r.weight || 1), 0);
    const weightedSum = ratings.reduce((acc, r) => acc + (r.rating * (r.weight || 1)), 0);
    const overallRating = totalWeight > 0 ? (weightedSum / totalWeight) : 0;

    const status: ReviewStatus = asDraft ? 'DRAFT' : 'SUBMITTED';

    return prisma.$transaction(async (tx) => {
        const review = await (tx as any).performanceReview.create({
            data: {
                userId,
                companyId,
                reviewerId,
                reviewCycle,
                overallRating,
                comments: overallComments,
                status,
                ratings: {
                    create: ratings.map(r => ({
                        kpiId: r.kpiId,
                        rating: r.rating,
                        comments: r.comments
                    }))
                }
            }
        });

        if (!asDraft) {
            try {
                await createNotification({
                    userId,
                    companyId,
                    title: 'Performance Review Submitted',
                    message: `Your performance review for cycle "${reviewCycle}" has been submitted for HR review.`,
                    type: 'INFO'
                });
            } catch (e) { }
        }

        return review;
    });
};

/**
 * STAGE 2 / 3: HR Advances the review status.
 * SUBMITTED → HR_REVIEW (only by HR_ADMIN/ADMIN)
 * SUBMITTED → FINALIZED (direct finalize)
 * Adds final HR comments and locks overall rating.
 */
export const advanceReviewStatus = async (
    reviewId: string,
    companyId: string,
    newStatus: 'SUBMITTED' | 'FINALIZED',
    hrComments?: string
) => {
    const review = await (prisma as any).performanceReview.findFirst({
        where: { id: reviewId, companyId }
    });

    if (!review) throw new Error('Review not found');

    const allowedTransitions: Record<string, string[]> = {
        DRAFT: ['SUBMITTED'],
        SUBMITTED: ['FINALIZED'],
    };

    if (!allowedTransitions[review.status]?.includes(newStatus)) {
        throw new Error(`Invalid transition: ${review.status} → ${newStatus}`);
    }

    const updated = await (prisma as any).performanceReview.update({
        where: { id: reviewId },
        data: {
            status: newStatus,
            ...(hrComments ? { comments: hrComments } : {})
        }
    });

    if (newStatus === 'FINALIZED') {
        try {
            await createNotification({
                userId: review.userId,
                companyId,
                title: 'Performance Review Finalized',
                message: `Your performance review for cycle "${review.reviewCycle}" has been officially finalized with a rating of ${Number(review.overallRating).toFixed(2)}.`,
                type: 'SUCCESS'
            });
        } catch (e) { }
    }

    return updated;
};

export const getUserReviews = async (userId: string, companyId: string) => {
    return (prisma as any).performanceReview.findMany({
        where: { userId, companyId },
        include: {
            reviewer: { select: { name: true, designation: true } },
            ratings: { include: { kpi: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const getTeamReviews = async (managerId: string, companyId: string) => {
    return (prisma as any).performanceReview.findMany({
        where: {
            companyId,
            user: { managerId }
        },
        include: {
            user: { select: { name: true, designation: true } },
            reviewer: { select: { name: true } },
            ratings: { include: { kpi: true } }
        }
    });
};

export const getCompanyReviews = async (companyId: string, status?: ReviewStatus) => {
    return (prisma as any).performanceReview.findMany({
        where: {
            companyId,
            ...(status ? { status } : {})
        },
        include: {
            user: { select: { name: true, email: true, designation: true } },
            reviewer: { select: { name: true } },
            ratings: { include: { kpi: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};
