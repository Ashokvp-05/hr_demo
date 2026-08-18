import { Router } from 'express';
import * as payslipController from '../controllers/payslip.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();

// Payslip uploads are PDFs (occasionally office docs). Cap the size and
// restrict the file type so the endpoint can't be used for memory-exhaustion
// DoS or to smuggle arbitrary/executable files into storage.
const ALLOWED_PAYSLIP_MIME = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv',
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_PAYSLIP_MIME.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, XLSX, XLS, CSV.`));
        }
    },
});

router.use(authenticate);

// Employee actions
router.get('/my', payslipController.getMyPayslips);
router.get('/:id/download', payslipController.downloadPayslip);

// HR / Super Admin Management actions
const PAYROLL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR', 'HR_MANAGER', 'MANAGER'];

router.get('/all', authorize(PAYROLL_ROLES), payslipController.getAllPayslips);
router.post('/upload', authorize(PAYROLL_ROLES), upload.single('file'), payslipController.uploadPayslip);
router.post('/generate', authorize(PAYROLL_ROLES), payslipController.generatePayslip);
router.patch('/:id/release', authorize(PAYROLL_ROLES), payslipController.releasePayslip);
router.post('/bulk-release', authorize(PAYROLL_ROLES), payslipController.bulkRelease);
router.delete('/:id', authorize(PAYROLL_ROLES), payslipController.deletePayslip);
router.put('/:id', authorize(PAYROLL_ROLES), payslipController.updatePayslip);

export default router;
