import { Router } from 'express';
import * as timeEntryController from '../controllers/timeEntry.controller';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/active', timeEntryController.getActive);
router.get('/active-users', timeEntryController.getAllActiveUsers);
router.get('/attendance-by-date', timeEntryController.getAttendanceByDate);
router.post('/clock-in', timeEntryController.clockIn);
router.post('/clock-out', timeEntryController.clockOut);
router.get('/history', timeEntryController.getHistory);
router.get('/summary', timeEntryController.getSummary);

// Reports - Admin only or Manager
router.get('/reports', reportController.getAttendanceReport);
router.get('/reports/excel', reportController.exportExcel);
router.get('/reports/pdf', reportController.exportPDF);

export default router;
