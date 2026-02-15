const {
  updateOrganization,
  getOrganizationById,
  getUserById,
  updateUser
} = require('../repositories/tursoRepository');
const { getPlanConfig, PLANS } = require('../services/subscriptionService');
const { asyncHandler } = require('../middleware/errorMiddleware');

const isOrgAdmin = (req) => ['owner', 'admin'].includes(req.user.organizationRole);

const getOrganization = asyncHandler(async (req, res) => {
  const organization = await getOrganizationById(req.organization.id);

  res.status(200).json({
    success: true,
    data: organization
  });
});

const updateOrganizationHandler = asyncHandler(async (req, res) => {
  if (!isOrgAdmin(req)) {
    return res.status(403).json({ success: false, error: 'Only organization owner or admin can update organization' });
  }

  const fieldsToUpdate = {};

  if (req.body.name) fieldsToUpdate.name = req.body.name;
  if (req.body.settings) fieldsToUpdate.settings = { ...req.organization.settings, ...req.body.settings };

  const org = await updateOrganization(req.organization.id, fieldsToUpdate);

  return res.status(200).json({ success: true, data: org });
});

const updatePlan = asyncHandler(async (req, res) => {
  if (req.user.organizationRole !== 'owner') {
    return res.status(403).json({ success: false, error: 'Only organization owner can update plan' });
  }

  const { plan } = req.body;
  if (!plan || !PLANS[plan]) {
    return res.status(400).json({ success: false, error: `Plan must be one of: ${Object.keys(PLANS).join(', ')}` });
  }

  const org = await updateOrganization(req.organization.id, { plan });

  return res.status(200).json({
    success: true,
    data: {
      id: org.id,
      name: org.name,
      plan: org.plan,
      limits: getPlanConfig(org.plan)
    }
  });
});

const addMember = asyncHandler(async (req, res) => {
  if (!isOrgAdmin(req)) {
    return res.status(403).json({ success: false, error: 'Only organization owner or admin can add members' });
  }

  const { userId, role = 'member' } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }

  const validRoles = ['owner', 'admin', 'member'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: `role must be one of: ${validRoles.join(', ')}` });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const planConfig = getPlanConfig(req.organization.plan);
  const organizationUsers = await require('../utils/database').getDB().execute({
    sql: 'SELECT COUNT(*) as count FROM users WHERE organization_id = ?',
    args: [req.organization.id]
  });

  if (organizationUsers.rows[0].count >= planConfig.seatLimit) {
    return res.status(402).json({ success: false, error: `Seat limit reached for ${planConfig.name} plan` });
  }

  const updatedUser = await updateUser(user.id, {
    organization: req.organization.id,
    organizationRole: role
  });

  return res.status(200).json({
    success: true,
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      organization: updatedUser.organization,
      organizationRole: updatedUser.organizationRole
    }
  });
});

module.exports = {
  getOrganization,
  updateOrganization: updateOrganizationHandler,
  updatePlan,
  addMember
};
