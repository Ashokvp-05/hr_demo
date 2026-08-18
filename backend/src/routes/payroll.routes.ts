
import { Router } from 'express';
import * as payrollController from '../controllers/payroll.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// ---------------------------------------------------------------------
// 🔹 EMPLOYEE ACCESS (View Own Payslips)
// ---------------------------------------------------------------------
router.get('/my-payslips', authorize(['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'HR']), payrollController.getMyPayslips);


// Managers and Admins are restricted from viewing organizational financial batches.
// Managers and Admins are restricted from viewing organizational financial batches.
const VIEW_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'HR', 'PAYROLL_ADMIN', 'AUDITOR', 'HR_MANAGER', 'MANAGER'];

router.get('/stats', authorize(VIEW_ROLES), payrollController.getStats);
router.get('/batches', authorize(VIEW_ROLES), payrollController.getAllBatches);
router.get('/batches/:batchId', authorize(VIEW_ROLES), payrollController.getBatch);


// 🔹 PAYROLL AUTHORITY (Full Control)
// ---------------------------------------------------------------------
// Only HR and Super Admin can create batches, generate payslips, and change status.
const ADMIN_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'HR', 'PAYROLL_ADMIN', 'HR_MANAGER'];

router.post('/batches', authorize(ADMIN_ROLES), payrollController.createBatch);
router.post('/batches/:batchId/generate', authorize(ADMIN_ROLES), payrollController.generatePayslips);
router.put('/batches/:batchId/status', authorize(ADMIN_ROLES), payrollController.updateBatchStatus);

// 🔹 SALARY & FINANCE DETAILS
router.get('/salary-config/:userId', authorize(VIEW_ROLES), payrollController.getSalaryConfig);
router.put('/salary-config/:userId', authorize(ADMIN_ROLES), payrollController.updateSalaryConfig);

router.get('/bank-details/:userId', authorize(VIEW_ROLES), payrollController.getBankDetails);
router.put('/bank-details/:userId', authorize(ADMIN_ROLES), payrollController.updateBankDetails);

router.get('/tax-details/:userId', authorize(VIEW_ROLES), payrollController.getTaxDetails);
router.put('/tax-details/:userId', authorize(ADMIN_ROLES), payrollController.updateTaxDetails);

export default router;
