const PLANS = {
  starter: {
    name: 'Starter',
    monthlyRequestLimit: 1000,
    seatLimit: 3,
    supportsSso: false,
    supportsAuditLogs: false
  },
  growth: {
    name: 'Growth',
    monthlyRequestLimit: 10000,
    seatLimit: 25,
    supportsSso: true,
    supportsAuditLogs: true
  },
  enterprise: {
    name: 'Enterprise',
    monthlyRequestLimit: 100000,
    seatLimit: 500,
    supportsSso: true,
    supportsAuditLogs: true
  }
};

const getPlanConfig = (plan = 'starter') => {
  return PLANS[plan] || PLANS.starter;
};

module.exports = {
  PLANS,
  getPlanConfig
};
