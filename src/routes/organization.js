const express = require('express');
const {
  getOrganization,
  updateOrganization,
  updatePlan,
  addMember
} = require('../controllers/organizationController');
const { protect } = require('../middleware/auth');
const { attachOrganization } = require('../middleware/tenant');

const router = express.Router();

router.use(protect);
router.use(attachOrganization);

router.get('/me', getOrganization);
router.put('/me', updateOrganization);
router.put('/me/plan', updatePlan);
router.post('/me/members', addMember);

module.exports = router;
