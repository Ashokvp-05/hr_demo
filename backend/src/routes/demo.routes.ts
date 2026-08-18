import { Router } from 'express';
import { resetDemoData, getDemoStatus } from '../controllers/demo.controller';

const router = Router();

router.get('/status', getDemoStatus);           // Public — check if demo is seeded
router.post('/reset', resetDemoData);           // Secret-protected — reseed demo data

export default router;
