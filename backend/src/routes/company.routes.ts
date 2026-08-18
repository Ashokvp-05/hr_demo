import { Router } from 'express';
import * as companyController from '../controllers/company.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Only SUPER_ADMIN can manage companies
router.use(authenticate as any);
router.use(authorize(['SUPER_ADMIN']) as any);

router.get('/', companyController.list);
router.get('/stats', companyController.stats);
router.get('/super-admin-dashboard', companyController.superAdminDashboard);
router.get('/:id', companyController.getById);
router.post('/', companyController.create);
router.patch('/:id/status', companyController.updateStatus);


export default router;
