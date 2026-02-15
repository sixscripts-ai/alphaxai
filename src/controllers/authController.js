const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const {
  findUserByEmail,
  createUser,
  updateUser,
  findOrganizationBySlug,
  createOrganization,
  updateOrganization,
  getOrganizationById,
  getUserById,
  findUserByResetToken
} = require('../repositories/tursoRepository');
const { asyncHandler } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const signToken = (userId) => jwt.sign({ id: userId }, config.auth.jwt.secret, { expiresIn: config.auth.jwt.expiresIn });

const sanitizeUser = (user) => {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
};

const createOrganizationSlug = async (seed) => {
  const base = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'workspace';
  let suffix = 0;
  let slug = base;

  while (await findOrganizationBySlug(slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, companyName } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide name, email, and password' });
  }

  const normalizedEmail = String(email).toLowerCase();
  const userExists = await findUserByEmail(normalizedEmail);
  if (userExists) {
    return res.status(400).json({ success: false, error: 'User already exists' });
  }

  const organizationName = companyName || `${name}'s Workspace`;
  const organization = await createOrganization({ name: organizationName, slug: await createOrganizationSlug(organizationName), plan: 'starter' });
  const passwordHash = await bcrypt.hash(password, config.auth.bcrypt.rounds);

  const user = await createUser({
    name,
    email: normalizedEmail,
    passwordHash,
    role: 'user',
    organization: organization.id,
    organizationRole: 'owner'
  });

  await updateOrganization(organization.id, { owner: user.id });

  const token = signToken(user.id);
  logger.info(`User registered: ${user.email}`);

  return res.status(201).json({
    success: true,
    token,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan
      }
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide an email and password' });
  }

  const user = await findUserByEmail(email, true);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  await updateUser(user.id, { lastLoginAt: new Date().toISOString() });
  const token = signToken(user.id);
  logger.info(`User logged in: ${user.email}`);

  return res.status(200).json({
    success: true,
    token,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      organizationRole: user.organizationRole
    }
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, message: 'User logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  const organization = user?.organization ? await getOrganizationById(user.organization) : null;

  return res.status(200).json({
    success: true,
    data: {
      ...sanitizeUser(user),
      organization
    }
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    preferences: req.body.preferences
  };

  const user = await updateUser(req.user.id, fieldsToUpdate);

  return res.status(200).json({
    success: true,
    data: sanitizeUser(user)
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const user = await findUserByEmail(req.body.email, true);

  if (!user) {
    return res.status(404).json({ success: false, error: 'There is no user with that email' });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await updateUser(user.id, { passwordResetToken, passwordResetExpires });

  logger.info(`Password reset requested for: ${user.email}`);
  return res.status(200).json({
    success: true,
    message: 'Password reset token generated',
    resetToken
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
  const user = await findUserByResetToken(resetPasswordToken);

  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid token' });
  }

  const passwordHash = await bcrypt.hash(req.body.password, config.auth.bcrypt.rounds);
  await updateUser(user.id, {
    passwordHash,
    passwordResetToken: null,
    passwordResetExpires: null
  });

  const token = signToken(user.id);
  logger.info(`Password reset successful for: ${user.email}`);

  return res.status(200).json({ success: true, token });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword
};
