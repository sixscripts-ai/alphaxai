import { Router } from 'express';
import { SupplierAnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/spend', SupplierAnalyticsController.getSpendBreakdown);
router.get('/lead-times', SupplierAnalyticsController.getLeadTimeStats);

export default router;
