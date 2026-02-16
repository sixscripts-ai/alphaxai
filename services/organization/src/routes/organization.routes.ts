import { Router } from 'express';
import { getOrganization } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getOrganization);

export default router;
