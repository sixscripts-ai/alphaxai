import { Router } from 'express';
import { getOrganization, getUsers } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getOrganization);
router.get('/users', getUsers);

export default router;
