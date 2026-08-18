import { Router } from 'express';
import * as holidayController from '../controllers/holiday.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', holidayController.list);
router.post('/', requireRole(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR']), holidayController.create);
router.delete('/:id', requireRole(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR']), holidayController.remove);
router.post('/sync', requireRole(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR']), holidayController.sync);

export default router;
