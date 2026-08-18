import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/register-company', authController.registerCompany);
router.post('/login', authController.login);
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/update-role', authenticate as any, authController.updateDemoRole);
router.post('/request-access', authController.requestAccess);
router.get('/access-requests', authenticate as any, authController.getAccessRequests);
router.get('/access-requests-public', authController.getAccessRequestsPublic);  // secret via query param, no login needed
router.get('/login-logs-public', authController.getLoginLogsPublic);  // secret via query param, no login needed
router.post('/update-access', authenticate as any, authController.updateAccessStatus);
router.post('/admin-approve', authController.adminBootstrapApprove);  // secret-key protected, no session needed
router.post('/session-logout', authController.sessionLogout);         // clears active session lock on logout
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/change-password', authenticate as any, authController.changePassword);
router.post('/refresh-token', authenticate as any, authController.refreshToken);

// 2FA Routes
router.post('/2fa/verify', authController.verify2FALogin);
router.post('/2fa/setup', authenticate as any, authController.setup2FA);
router.post('/2fa/activate', authenticate as any, authController.activate2FA);
router.post('/2fa/disable', authenticate as any, authController.disable2FA);
router.post('/logout-others', authenticate as any, authController.logoutOthers);

export default router;
