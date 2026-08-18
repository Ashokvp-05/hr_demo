import { Router } from 'express';
import * as leaveV2Controller from '../controllers/leave-v2.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.post('/leave-types', leaveV2Controller.createLeaveType);
router.get('/leave-types', leaveV2Controller.getLeaveTypes);
router.post('/initialize-balances', leaveV2Controller.initializeBalancesForUser);

router.post('/request-v2', leaveV2Controller.requestLeave);
router.put('/approve-v2/:requestId', leaveV2Controller.approveLeave);

export default router;
