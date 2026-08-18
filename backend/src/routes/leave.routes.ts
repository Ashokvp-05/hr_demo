import { Router } from 'express';
import * as leaveController from '../controllers/leave.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

const LEAVE_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'OPS_ADMIN', 'VIEWER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'];

router.use(authenticate);

router.post('/request', leaveController.createRequest);
router.get('/my-requests', leaveController.getMyRequests);
router.get('/balance', leaveController.getBalance);
router.get('/all', requireRole(LEAVE_ADMIN_ROLES), leaveController.getAllRequests);
router.put('/:id/approve', requireRole(LEAVE_ADMIN_ROLES), leaveController.approveRequest);
router.put('/:id/reject', requireRole(LEAVE_ADMIN_ROLES), leaveController.rejectRequest);
router.delete('/:id', requireRole(LEAVE_ADMIN_ROLES), leaveController.deleteRequest);

export default router;
