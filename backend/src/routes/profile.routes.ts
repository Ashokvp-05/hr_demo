import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', userController.getCurrentUser);
router.patch('/', userController.updateProfile);
router.post('/avatar', userController.updateAvatar);
router.get('/export', userController.exportData);
router.delete('/', userController.deleteAccount);

// Documents
router.get('/documents', userController.getDocuments);
router.post('/documents', userController.uploadDocument);
router.delete('/documents/:id', userController.deleteDocument);

export default router;
