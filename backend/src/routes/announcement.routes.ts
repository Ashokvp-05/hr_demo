import { Router } from 'express';
import * as announcementController from '../controllers/announcement.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Public (authenticated) view
router.get('/', announcementController.getAnnouncements);

// Admin only management
router.post('/', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'OPS_ADMIN', 'HR_MANAGER', 'MANAGER']), announcementController.createAnnouncement);
router.delete('/:id', requireRole(['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'OPS_ADMIN', 'HR_MANAGER', 'MANAGER']), announcementController.deleteAnnouncement);

export default router;
