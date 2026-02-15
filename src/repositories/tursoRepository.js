const crypto = require('crypto');
const { getDB } = require('../utils/database');

const nowIso = () => new Date().toISOString();

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch (_error) { return fallback; }
};

const toUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    organization: row.organization_id,
    organizationRole: row.organization_role,
    preferences: parseJson(row.preferences, {}),
    apiUsage: {
      totalRequests: row.total_requests || 0,
      monthlyRequests: row.monthly_requests || 0,
      lastRequestAt: row.last_request_at || null,
      currentMonth: row.current_month || new Date().toISOString().slice(0, 7)
    },
    lastLoginAt: row.last_login_at || null,
    passwordResetToken: row.password_reset_token || null,
    passwordResetExpires: row.password_reset_expires || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    password: row.password
  };
};

const toOrganization = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    owner: row.owner_id,
    plan: row.plan,
    settings: parseJson(row.settings, { allowMemberInvites: true, ssoEnabled: false, ipAllowlist: [] }),
    usage: {
      monthlyRequests: row.monthly_requests || 0,
      currentMonth: row.current_month || new Date().toISOString().slice(0, 7)
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const toConversation = (row, includeMessages = true) => {
  if (!row) return null;
  const response = {
    id: row.id,
    user: row.user_id,
    organization: row.organization_id,
    title: row.title,
    settings: parseJson(row.settings, { model: 'gemini-pro-3', temperature: 0.7, maxTokens: 2000, systemPrompt: '' }),
    totalTokens: row.total_tokens || 0,
    estimatedCost: row.estimated_cost || 0,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (includeMessages) response.messages = parseJson(row.messages, []);
  return response;
};

const generateId = () => crypto.randomUUID();

const createOrganization = async ({ name, slug, owner, plan = 'starter' }) => {
  const db = getDB();
  const id = generateId();
  const createdAt = nowIso();
  await db.execute({
    sql: `INSERT INTO organizations (id, name, slug, owner_id, plan, settings, monthly_requests, current_month, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    args: [id, name, slug, owner || null, plan, JSON.stringify({ allowMemberInvites: true, ssoEnabled: false, ipAllowlist: [] }), createdAt.slice(0, 7), createdAt, createdAt]
  });
  return toOrganization((await db.execute({ sql: 'SELECT * FROM organizations WHERE id = ?', args: [id] })).rows[0]);
};

const updateOrganization = async (id, fields) => {
  const db = getDB();
  const updates = [];
  const args = [];
  if (fields.name !== undefined) { updates.push('name = ?'); args.push(fields.name); }
  if (fields.plan !== undefined) { updates.push('plan = ?'); args.push(fields.plan); }
  if (fields.settings !== undefined) { updates.push('settings = ?'); args.push(JSON.stringify(fields.settings)); }
  if (fields.monthlyRequests !== undefined) { updates.push('monthly_requests = ?'); args.push(fields.monthlyRequests); }
  if (fields.currentMonth !== undefined) { updates.push('current_month = ?'); args.push(fields.currentMonth); }
  if (fields.owner !== undefined) { updates.push('owner_id = ?'); args.push(fields.owner); }
  if (updates.length === 0) return getOrganizationById(id);
  updates.push('updated_at = ?');
  args.push(nowIso(), id);
  await db.execute({ sql: `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`, args });
  return getOrganizationById(id);
};

const findOrganizationBySlug = async (slug) => {
  const db = getDB();
  return toOrganization((await db.execute({ sql: 'SELECT * FROM organizations WHERE slug = ? LIMIT 1', args: [slug] })).rows[0]);
};

const getOrganizationById = async (id) => {
  const db = getDB();
  return toOrganization((await db.execute({ sql: 'SELECT * FROM organizations WHERE id = ? LIMIT 1', args: [id] })).rows[0]);
};

const createUser = async ({ name, email, passwordHash, role = 'user', organization, organizationRole = 'member' }) => {
  const db = getDB();
  const id = generateId();
  const createdAt = nowIso();
  await db.execute({
    sql: `INSERT INTO users (id, name, email, password, role, organization_id, organization_role, preferences, total_requests, monthly_requests, current_month, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
    args: [id, name, email.toLowerCase(), passwordHash, role, organization || null, organizationRole, JSON.stringify({}), createdAt.slice(0, 7), createdAt, createdAt]
  });
  return getUserById(id, true);
};

const getUserById = async (id, includePassword = false) => {
  const db = getDB();
  const user = toUser((await db.execute({ sql: 'SELECT * FROM users WHERE id = ? LIMIT 1', args: [id] })).rows[0]);
  if (!includePassword && user) delete user.password;
  return user;
};

const findUserByEmail = async (email, includePassword = false) => {
  const db = getDB();
  const user = toUser((await db.execute({ sql: 'SELECT * FROM users WHERE email = ? LIMIT 1', args: [email.toLowerCase()] })).rows[0]);
  if (!includePassword && user) delete user.password;
  return user;
};

const listUsers = async ({ limit, offset }) => {
  const db = getDB();
  const result = await db.execute({ sql: 'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', args: [limit, offset] });
  return result.rows.map((row) => {
    const user = toUser(row);
    delete user.password;
    return user;
  });
};

const countUsers = async () => {
  const db = getDB();
  const result = await db.execute('SELECT COUNT(*) as count FROM users');
  return result.rows[0].count || 0;
};

const updateUser = async (id, fields) => {
  const db = getDB();
  const updates = [];
  const args = [];
  if (fields.name !== undefined) { updates.push('name = ?'); args.push(fields.name); }
  if (fields.email !== undefined) { updates.push('email = ?'); args.push(fields.email.toLowerCase()); }
  if (fields.role !== undefined) { updates.push('role = ?'); args.push(fields.role); }
  if (fields.organization !== undefined) { updates.push('organization_id = ?'); args.push(fields.organization); }
  if (fields.organizationRole !== undefined) { updates.push('organization_role = ?'); args.push(fields.organizationRole); }
  if (fields.preferences !== undefined) { updates.push('preferences = ?'); args.push(JSON.stringify(fields.preferences)); }
  if (fields.passwordHash !== undefined) { updates.push('password = ?'); args.push(fields.passwordHash); }
  if (fields.lastLoginAt !== undefined) { updates.push('last_login_at = ?'); args.push(fields.lastLoginAt); }
  if (fields.passwordResetToken !== undefined) { updates.push('password_reset_token = ?'); args.push(fields.passwordResetToken); }
  if (fields.passwordResetExpires !== undefined) { updates.push('password_reset_expires = ?'); args.push(fields.passwordResetExpires); }
  if (fields.totalRequests !== undefined) { updates.push('total_requests = ?'); args.push(fields.totalRequests); }
  if (fields.monthlyRequests !== undefined) { updates.push('monthly_requests = ?'); args.push(fields.monthlyRequests); }
  if (fields.lastRequestAt !== undefined) { updates.push('last_request_at = ?'); args.push(fields.lastRequestAt); }
  if (fields.currentMonth !== undefined) { updates.push('current_month = ?'); args.push(fields.currentMonth); }
  if (updates.length === 0) return getUserById(id);
  updates.push('updated_at = ?');
  args.push(nowIso(), id);
  await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });
  return getUserById(id);
};

const deleteUser = async (id) => {
  const db = getDB();
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
};

const findUserByResetToken = async (tokenHash) => {
  const db = getDB();
  return toUser((await db.execute({ sql: 'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > ? LIMIT 1', args: [tokenHash, nowIso()] })).rows[0]);
};

const createConversation = async ({ userId, organizationId, title, settings }) => {
  const db = getDB();
  const id = generateId();
  const createdAt = nowIso();
  await db.execute({
    sql: `INSERT INTO conversations (id, user_id, organization_id, title, messages, settings, total_tokens, estimated_cost, is_archived, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
    args: [id, userId, organizationId, title, JSON.stringify([]), JSON.stringify(settings), createdAt, createdAt]
  });
  return getConversationById(id, userId, organizationId);
};

const listConversations = async ({ userId, organizationId, limit, offset }) => {
  const db = getDB();
  const result = await db.execute({
    sql: 'SELECT * FROM conversations WHERE user_id = ? AND organization_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?',
    args: [userId, organizationId, limit, offset]
  });
  return result.rows.map((row) => toConversation(row, false));
};

const countConversations = async ({ userId, organizationId }) => {
  const db = getDB();
  const result = await db.execute({ sql: 'SELECT COUNT(*) as count FROM conversations WHERE user_id = ? AND organization_id = ?', args: [userId, organizationId] });
  return result.rows[0].count || 0;
};

const getConversationById = async (id, userId, organizationId) => {
  const db = getDB();
  return toConversation((await db.execute({ sql: 'SELECT * FROM conversations WHERE id = ? AND user_id = ? AND organization_id = ? LIMIT 1', args: [id, userId, organizationId] })).rows[0]);
};

const updateConversation = async (id, userId, organizationId, fields) => {
  const existing = await getConversationById(id, userId, organizationId);
  if (!existing) return null;
  const next = {
    title: fields.title ?? existing.title,
    settings: fields.settings ? { ...existing.settings, ...fields.settings } : existing.settings,
    messages: fields.messages ?? existing.messages,
    totalTokens: fields.totalTokens ?? existing.totalTokens,
    estimatedCost: fields.estimatedCost ?? existing.estimatedCost,
    isArchived: fields.isArchived ?? existing.isArchived
  };
  const db = getDB();
  await db.execute({
    sql: `UPDATE conversations SET title = ?, settings = ?, messages = ?, total_tokens = ?, estimated_cost = ?, is_archived = ?, updated_at = ?
          WHERE id = ? AND user_id = ? AND organization_id = ?`,
    args: [next.title, JSON.stringify(next.settings), JSON.stringify(next.messages), next.totalTokens, next.estimatedCost, next.isArchived ? 1 : 0, nowIso(), id, userId, organizationId]
  });
  return getConversationById(id, userId, organizationId);
};

const deleteConversation = async (id, userId, organizationId) => {
  const db = getDB();
  const result = await db.execute({ sql: 'DELETE FROM conversations WHERE id = ? AND user_id = ? AND organization_id = ?', args: [id, userId, organizationId] });
  return result.rowsAffected > 0;
};

module.exports = {
  createOrganization,
  updateOrganization,
  findOrganizationBySlug,
  getOrganizationById,
  createUser,
  getUserById,
  findUserByEmail,
  listUsers,
  countUsers,
  updateUser,
  deleteUser,
  findUserByResetToken,
  createConversation,
  listConversations,
  countConversations,
  getConversationById,
  updateConversation,
  deleteConversation
};
