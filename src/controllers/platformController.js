const { getDB } = require('../utils/database');
const Joi = require('joi');
const { asyncHandler } = require('../middleware/errorMiddleware');

const leadSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email().max(254).required(),
  company: Joi.string().trim().max(120).allow('', null),
  message: Joi.string().trim().max(2000).allow('', null)
});

const submitLead = asyncHandler(async (req, res) => {
  const { error, value } = leadSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details.map((detail) => detail.message).join(', ')
    });
  }

  const { name, email, company, message } = value;

  const db = getDB();

  try {
    await db.execute({
      sql: 'INSERT INTO platform_leads (name, email, company, message) VALUES (?, ?, ?, ?)',
      args: [name, email, company || null, message || null]
    });
  } catch (dbError) {
    if (String(dbError.message).includes('UNIQUE constraint failed: platform_leads.email')) {
      return res.status(409).json({
        success: false,
        error: 'Lead already exists for this email'
      });
    }

    throw dbError;
  }

  res.status(201).json({
    success: true,
    message: 'Lead submitted successfully'
  });
});

const getLeads = asyncHandler(async (_req, res) => {
  const db = getDB();

  const result = await db.execute('SELECT id, name, email, company, message, created_at FROM platform_leads ORDER BY id DESC LIMIT 100');

  res.status(200).json({
    success: true,
    data: result.rows
  });
});

module.exports = {
  submitLead,
  getLeads
};
