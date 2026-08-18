import { Router } from 'express';
import * as attendanceV2Controller from '../controllers/attendance-v2.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.post('/shifts', attendanceV2Controller.createShift);
router.get('/shifts', attendanceV2Controller.getShifts);
router.post('/shifts/assign', attendanceV2Controller.assignShift);

router.post('/clock-in-v2', attendanceV2Controller.clockIn);
router.post('/clock-out-v2', attendanceV2Controller.clockOut);
router.post('/corrections', attendanceV2Controller.requestCorrection);

export default router;
