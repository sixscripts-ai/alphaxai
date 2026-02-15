const {
  listUsers,
  countUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../repositories/tursoRepository');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const users = await listUsers({ limit, offset: skip });
  const total = await countUsers();

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

const getUser = asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Not authorized to access this user' });
  }

  const user = await getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.status(200).json({ success: true, data: user });
});

const updateUserHandler = asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Not authorized to update this user' });
  }

  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    preferences: req.body.preferences
  };

  if (req.user.role === 'admin' && req.body.role) {
    fieldsToUpdate.role = req.body.role;
  }

  const user = await updateUser(req.params.id, fieldsToUpdate);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.status(200).json({ success: true, data: user });
});

const deleteUserHandler = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  await deleteUser(req.params.id);

  return res.status(200).json({ success: true, message: 'User deleted' });
});

const getUserStats = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);

  const stats = {
    totalRequests: user.apiUsage.totalRequests,
    monthlyRequests: user.apiUsage.monthlyRequests,
    lastRequestAt: user.apiUsage.lastRequestAt,
    memberSince: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };

  return res.status(200).json({ success: true, data: stats });
});

module.exports = {
  getUsers,
  getUser,
  updateUser: updateUserHandler,
  deleteUser: deleteUserHandler,
  getUserStats
};
