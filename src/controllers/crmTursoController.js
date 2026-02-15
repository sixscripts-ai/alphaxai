const { getDB } = require('../utils/turso');
const { v4: uuidv4 } = require('uuid');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

// Dashboard Statistics
exports.getDashboard = async (req, res) => {
  try {
    const db = getDB();
    
    // Get statistics
    const contactsResult = await db.execute('SELECT COUNT(*) as count FROM contacts');
    const dealsResult = await db.execute('SELECT COUNT(*) as count, SUM(amount) as total FROM deals');
    const inventoryResult = await db.execute('SELECT COUNT(*) as count, SUM(quantity) as total FROM inventory');
    const lowStockResult = await db.execute('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity');
    
    // Get recent activities
    const recentContacts = await db.execute('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5');
    const recentDeals = await db.execute('SELECT * FROM deals ORDER BY created_at DESC LIMIT 5');
    
    res.json({
      success: true,
      data: {
        stats: {
          totalContacts: contactsResult.rows[0].count || 0,
          totalDeals: dealsResult.rows[0].count || 0,
          totalRevenue: dealsResult.rows[0].total || 0,
          inventoryItems: inventoryResult.rows[0].count || 0,
          totalStock: inventoryResult.rows[0].total || 0,
          lowStockItems: lowStockResult.rows[0].count || 0
        },
        recentActivities: {
          contacts: recentContacts.rows,
          deals: recentDeals.rows
        }
      }
    });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI-Powered Insights
exports.getInsights = async (req, res) => {
  try {
    const db = getDB();
    
    // Gather CRM data for analysis
    const contacts = await db.execute('SELECT * FROM contacts LIMIT 50');
    const deals = await db.execute('SELECT * FROM deals LIMIT 50');
    const inventory = await db.execute('SELECT * FROM inventory WHERE quantity <= min_quantity');
    
    const crmData = {
      totalContacts: contacts.rows.length,
      totalDeals: deals.rows.length,
      lowStockItems: inventory.rows.length,
      contacts: contacts.rows,
      deals: deals.rows,
      inventory: inventory.rows
    };
    
    const insights = await geminiService.analyzeCRMData(crmData);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Insights error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Contact Management
exports.createContact = async (req, res) => {
  try {
    const db = getDB();
    const { name, email, phone, company, status, source, value, notes, tags } = req.body;
    
    const id = uuidv4();
    const tagsJson = tags ? JSON.stringify(tags) : null;
    
    await db.execute({
      sql: `INSERT INTO contacts (id, name, email, phone, company, status, source, value, notes, tags) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, email, phone, company, status || 'lead', source, value || 0, notes, tagsJson]
    });
    
    const result = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [id]
    });
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const db = getDB();
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM contacts WHERE 1=1';
    const args = [];
    
    if (status) {
      sql += ' AND status = ?';
      args.push(status);
    }
    
    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
      const searchPattern = `%${search}%`;
      args.push(searchPattern, searchPattern, searchPattern);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(parseInt(limit), parseInt(offset));
    
    const result = await db.execute({ sql, args });
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const updates = req.body;
    
    const fields = [];
    const args = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        args.push(key === 'tags' && typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(id);
    
    await db.execute({
      sql: `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`,
      args
    });
    
    const result = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [id]
    });
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI Lead Scoring
exports.scoreContact = async (req, res) => {
  try {
    const db = getDB();
    const { contactId } = req.body;
    
    const result = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [contactId]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    const contact = result.rows[0];
    const scoreData = await geminiService.scoreContact(contact);
    
    // Update contact with score
    await db.execute({
      sql: 'UPDATE contacts SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [scoreData.score, contactId]
    });
    
    res.json({
      success: true,
      data: scoreData
    });
  } catch (error) {
    logger.error('Score contact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI Email Generation
exports.generateEmail = async (req, res) => {
  try {
    const db = getDB();
    const { contactId, purpose } = req.body;
    
    const result = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [contactId]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    
    const contact = result.rows[0];
    const email = await geminiService.generatePersonalizedEmail(contact, purpose);
    
    res.json({
      success: true,
      data: { email }
    });
  } catch (error) {
    logger.error('Generate email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deal Management
exports.createDeal = async (req, res) => {
  try {
    const db = getDB();
    const { title, contactId, amount, stage, probability, expectedCloseDate, notes } = req.body;
    
    const id = uuidv4();
    
    await db.execute({
      sql: `INSERT INTO deals (id, title, contact_id, amount, stage, probability, expected_close_date, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, title, contactId, amount, stage || 'prospecting', probability || 0, expectedCloseDate, notes]
    });
    
    const result = await db.execute({
      sql: 'SELECT * FROM deals WHERE id = ?',
      args: [id]
    });
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Create deal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDeals = async (req, res) => {
  try {
    const db = getDB();
    const { stage, limit = 50, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM deals WHERE 1=1';
    const args = [];
    
    if (stage) {
      sql += ' AND stage = ?';
      args.push(stage);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(parseInt(limit), parseInt(offset));
    
    const result = await db.execute({ sql, args });
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get deals error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateDeal = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const updates = req.body;
    
    const fields = [];
    const args = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        args.push(value);
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(id);
    
    await db.execute({
      sql: `UPDATE deals SET ${fields.join(', ')} WHERE id = ?`,
      args
    });
    
    const result = await db.execute({
      sql: 'SELECT * FROM deals WHERE id = ?',
      args: [id]
    });
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Update deal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI Deal Analysis
exports.analyzeDeal = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    
    const result = await db.execute({
      sql: 'SELECT * FROM deals WHERE id = ?',
      args: [id]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    
    const deal = result.rows[0];
    const analysis = await geminiService.analyzeDeal(deal);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Analyze deal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Inventory Management
exports.createInventoryItem = async (req, res) => {
  try {
    const db = getDB();
    const { sku, name, category, quantity, minQuantity, cost, price, supplier, location } = req.body;
    
    const id = uuidv4();
    
    await db.execute({
      sql: `INSERT INTO inventory (id, sku, name, category, quantity, min_quantity, cost, price, supplier, location, last_restock_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [id, sku, name, category, quantity || 0, minQuantity || 10, cost || 0, price || 0, supplier, location]
    });
    
    const result = await db.execute({
      sql: 'SELECT * FROM inventory WHERE id = ?',
      args: [id]
    });
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Create inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const db = getDB();
    const { category, lowStock, limit = 50, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM inventory WHERE 1=1';
    const args = [];
    
    if (category) {
      sql += ' AND category = ?';
      args.push(category);
    }
    
    if (lowStock === 'true') {
      sql += ' AND quantity <= min_quantity';
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(parseInt(limit), parseInt(offset));
    
    const result = await db.execute({ sql, args });
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const updates = req.body;
    
    const fields = [];
    const args = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        args.push(value);
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    args.push(id);
    
    await db.execute({
      sql: `UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`,
      args
    });
    
    const result = await db.execute({
      sql: 'SELECT * FROM inventory WHERE id = ?',
      args: [id]
    });
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Update inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// AI Inventory Predictions
exports.predictInventory = async (req, res) => {
  try {
    const db = getDB();
    const { sku } = req.body;
    
    const result = await db.execute({
      sql: 'SELECT * FROM inventory WHERE sku = ?',
      args: [sku]
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }
    
    const item = result.rows[0];
    const prediction = await geminiService.predictInventoryDemand(item);
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    logger.error('Predict inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Agentic Tool Execution
exports.executeAgent = async (req, res) => {
  try {
    const { task, context } = req.body;
    
    const result = await geminiService.executeAgenticTask(task, context);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Execute agent error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = exports;
