const { getPlanConfig, PLANS } = require('../src/services/subscriptionService');

describe('subscriptionService', () => {
  test('returns a known plan config', () => {
    const enterprise = getPlanConfig('enterprise');

    expect(enterprise.name).toBe('Enterprise');
    expect(enterprise.monthlyRequestLimit).toBe(100000);
    expect(enterprise.seatLimit).toBe(500);
  });

  test('falls back to starter plan for unknown plan ids', () => {
    const fallback = getPlanConfig('does-not-exist');

    expect(fallback).toEqual(PLANS.starter);
  });
});
