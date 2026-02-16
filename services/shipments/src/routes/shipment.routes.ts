import { Router } from 'express';
import { getShipments, getShipment, createShipment, updateShipmentStatus } from '../controllers/shipment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getShipments);
router.get('/:id', getShipment);
router.post('/', createShipment);
router.patch('/:id/status', updateShipmentStatus);

export default router;
