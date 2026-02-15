const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  // Users can only view their own profile unless admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this user'
    });
  }

  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  // Users can only update their own profile unless admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this user'
    });
  }

  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    preferences: req.body.preferences
  };

  // Only admins can update role
  if (req.user.role === 'admin' && req.body.role) {
    fieldsToUpdate.role = req.body.role;
  }

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted'
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  const stats = {
    totalRequests: user.apiUsage.totalRequests,
    monthlyRequests: user.apiUsage.monthlyRequests,
    lastRequestAt: user.apiUsage.lastRequestAt,
    memberSince: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats
};