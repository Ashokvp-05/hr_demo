import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/me', userController.getCurrentUser);
router.get('/', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'OPS_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER']), userController.getUsers);
router.put('/profile', userController.updateProfile);
router.put('/:id', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'OPS_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER']), userController.updateUser);
router.get('/:id', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'OPS_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER']), userController.getUserByIdHR);
router.get('/:id/documents', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'OPS_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER']), userController.getUserDocumentsHR);

export default router;
