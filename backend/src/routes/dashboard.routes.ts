
import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/employee', authenticate as any, dashboardController.getEmployeeDashboard);
router.get('/admin-stats', authenticate as any, dashboardController.getAdminStats);
router.get('/manager', authenticate as any, dashboardController.getManagerDashboard);
router.get('/manager/performance', authenticate as any, dashboardController.getManagerPerformance);
router.get('/manager/productivity', authenticate as any, dashboardController.getManagerProductivity);

export default router;
