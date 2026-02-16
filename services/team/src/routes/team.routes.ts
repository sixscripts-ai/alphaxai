import { Router } from 'express';
import { getTeamMembers, inviteMember, updateMemberRole, removeMember } from '../controllers/team.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTeamMembers);
router.post('/invite', inviteMember);
router.put('/:id/role', updateMemberRole);
router.delete('/:id', removeMember);

export default router;
