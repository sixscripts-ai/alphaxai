const jwt = require('jsonwebtoken');
const config = require('../../config');
const { getUserById } = require('../repositories/tursoRepository');
const { asyncHandler } = require('./errorMiddleware');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const hasBearer = authHeader.startsWith('Bearer ');

  if (!hasBearer) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token'
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.auth.jwt.secret);
    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, user not found'
      });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, token failed'
    });
  }
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `User role ${req.user.role} is not authorized to access this route`
    });
  }

  next();
};

module.exports = {
  protect,
  authorize
};
