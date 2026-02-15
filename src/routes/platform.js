const express = require('express');
const { submitLead, getLeads } = require('../controllers/platformController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const requireLeadViewerAccess = (req, res, next) => {
  const hasGlobalAdminRole = req.user.role === 'admin';
  const hasOrganizationAdminRole = ['owner', 'admin'].includes(req.user.organizationRole);

  if (!hasGlobalAdminRole && !hasOrganizationAdminRole) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to view platform leads'
    });
  }

  return next();
};

router.post('/leads', submitLead);
router.get('/leads', protect, requireLeadViewerAccess, getLeads);

module.exports = router;
