import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as userController from '../controllers/user.controller';
import * as leaveController from '../controllers/leave.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'OPS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'VIEWER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'AUDITOR'];
const WRITE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'OPS_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'];

router.use(authenticate);

// Read-Only Routes
router.get('/pending-users', authorize(ADMIN_ROLES), adminController.getPendingUsers);
router.get('/stats', authorize(ADMIN_ROLES), adminController.getStats);
router.get('/overview', authorize(ADMIN_ROLES), adminController.getOverview);
router.get('/roles', authorize(ADMIN_ROLES), adminController.getRoles);
router.get('/audit-logs', authorize(ADMIN_ROLES), adminController.getAuditLogs);

// Convenience aliases (frontend uses these paths)
router.get('/employees', authorize(ADMIN_ROLES), userController.getUsers);
router.post('/employees', authorize(WRITE_ROLES), adminController.createEmployee);
router.get('/leave-requests', authorize(ADMIN_ROLES), leaveController.getAllRequests);

// Write Routes

router.put('/users/:id/approve', authorize(WRITE_ROLES), adminController.approveUser);
router.put('/users/:id/reject', authorize(WRITE_ROLES), adminController.rejectUser);

// Settings & Config
router.get('/settings', authorize(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN']), adminController.getSettings);
router.patch('/settings', authorize(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN']), adminController.updateSettings);

// Advanced User Control
router.patch('/users/:id/status', authorize(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER']), adminController.toggleUserStatus);
router.patch('/users/:id/reset-password', authorize(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN']), adminController.resetUserPassword);
router.get('/users/:id/salary-config', authorize(['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'COMPANY_ADMIN', 'HR_MANAGER']), adminController.getSalaryConfig);
router.put('/users/:id/salary-config', authorize(['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR', 'COMPANY_ADMIN', 'HR_MANAGER']), adminController.updateSalaryConfig);
router.delete('/users/:id', authorize(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN']), adminController.deleteUser);

// Employee aliases (frontend UserManagementTable calls these)
router.patch('/employees/:id', authorize(WRITE_ROLES), adminController.updateEmployee);
router.delete('/employees/:id', authorize(['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN']), adminController.deleteUser);

// Leave balance management (HR)
router.get('/employees/:id/leave-balances', authorize(ADMIN_ROLES), adminController.getEmployeeLeaveBalances);
router.patch('/employees/:id/leave-balances', authorize(WRITE_ROLES), adminController.updateEmployeeLeaveBalances);

export default router;
