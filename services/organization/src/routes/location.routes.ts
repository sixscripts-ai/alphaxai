import { Router } from 'express';
import { createLocation, getLocations, getLocation, updateLocation } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createLocation);
router.get('/', getLocations);
router.get('/:id', getLocation);
router.patch('/:id', updateLocation);

export default router;
