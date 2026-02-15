const { getOrganizationById, updateOrganization } = require('../repositories/tursoRepository');
const { getPlanConfig } = require('../services/subscriptionService');
const { asyncHandler } = require('./errorMiddleware');

const currentMonth = () => new Date().toISOString().slice(0, 7);

const attachOrganization = asyncHandler(async (req, res, next) => {
  if (!req.user.organization) {
    return res.status(403).json({
      success: false,
      error: 'No organization is associated with this account'
    });
  }

  const organization = await getOrganizationById(req.user.organization);

  if (!organization) {
    return res.status(404).json({
      success: false,
      error: 'Organization not found'
    });
  }

  req.organization = organization;
  next();
});

const enforcePlanLimit = asyncHandler(async (req, res, next) => {
  if (!req.organization) {
    return res.status(500).json({
      success: false,
      error: 'Organization context is required for plan enforcement'
    });
  }

  const month = currentMonth();
  let monthlyRequests = req.organization.usage.monthlyRequests;

  if (req.organization.usage.currentMonth !== month) {
    monthlyRequests = 0;
  }

  const planConfig = getPlanConfig(req.organization.plan);

  if (monthlyRequests >= planConfig.monthlyRequestLimit) {
    return res.status(402).json({
      success: false,
      error: `Monthly request limit reached for ${planConfig.name} plan`
    });
  }

  req.organization = await updateOrganization(req.organization.id, {
    monthlyRequests: monthlyRequests + 1,
    currentMonth: month
  });

  next();
});

module.exports = {
  attachOrganization,
  enforcePlanLimit
};
