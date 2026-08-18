import { Router } from 'express';
import * as performanceController from '../controllers/performance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

const HR_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR'];

// KPI management (HR/Admin only)
router.post('/kpi', authorize(HR_ROLES), performanceController.createKPI);
router.get('/kpis', performanceController.getKPIs);

// Submit a review (any employee or manager)
router.post('/review', performanceController.submitReview);

// HR advances review status: DRAFT→SUBMITTED→FINALIZED
router.patch('/review/:id/status', authorize(HR_ROLES), performanceController.updateReviewStatus);

// View own reviews
router.get('/my-reviews', performanceController.getMyReviews);

// HR/Admin views team/dept reviews
router.get('/team', authorize(HR_ROLES), performanceController.getTeamPerformance);

// HR views ALL company reviews (with optional status filter)
router.get('/all', authorize(HR_ROLES), performanceController.getAllReviews);

export default router;
