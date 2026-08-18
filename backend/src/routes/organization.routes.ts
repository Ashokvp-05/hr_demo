import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/departments', organizationController.getDepartments);
router.post('/departments', organizationController.createDepartment);
router.put('/departments/:id', organizationController.updateDepartment);
router.delete('/departments/:id', organizationController.deleteDepartment);

router.get('/designations', organizationController.getDesignations);
router.post('/designations', organizationController.createDesignation);

router.get('/branches', organizationController.getBranches);
router.post('/branches', organizationController.createBranch);

router.get('/roles', organizationController.getRoles);
router.post('/roles', organizationController.createRole);

router.get('/stats', organizationController.getStats);

export default router;
