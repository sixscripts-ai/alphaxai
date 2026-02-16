import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/history', AnalyticsController.getHistory);
router.get('/forecast', AnalyticsController.getForecast);
router.get('/summary', AnalyticsController.getSummary);

export default router;
