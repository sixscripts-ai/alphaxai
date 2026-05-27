import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/history', AnalyticsController.getHistory);
router.get('/forecast', AnalyticsController.getForecast);
router.get('/summary', AnalyticsController.getSummary);
router.get('/top-movers', AnalyticsController.getTopMovers);
router.get('/turnover', AnalyticsController.getTurnoverTrend);
router.get('/abc-classification', AnalyticsController.getABCClassification);
router.get('/forecast-accuracy', AnalyticsController.getForecastAccuracy);

export default router;
