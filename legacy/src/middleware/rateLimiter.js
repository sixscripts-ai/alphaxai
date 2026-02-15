const { RateLimiterMemory } = require('rate-limiter-flexible');
const config = require('../../config');

const rateLimiter = new RateLimiterMemory({
  keyResolver: (req) => req.ip,
  points: config.auth.rateLimit.max,
  duration: config.auth.rateLimit.windowMs / 1000
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: secs
    });
  }
};

module.exports = rateLimiterMiddleware;