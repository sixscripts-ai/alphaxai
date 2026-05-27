import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ReportController.listReports);
router.post('/', ReportController.createReport);
router.put('/:id', ReportController.updateReport);
router.delete('/:id', ReportController.deleteReport);

export default router;
