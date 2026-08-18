import { Router } from 'express';
import * as kudosController from '../controllers/kudos.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/give', kudosController.giveKudos);
router.get('/received', kudosController.getReceivedKudos);
router.get('/given', kudosController.getGivenKudos);
router.get('/feed', kudosController.getCompanyFeed);
router.get('/analytics', kudosController.getAnalytics);

export default router;
