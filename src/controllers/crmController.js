const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const Inventory = require('../models/Inventory');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

/**
 * Get CRM dashboard overview
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [contacts, deals, inventory] = await Promise.all([
      Contact.find({ userId }).limit(100),
      Deal.find({ userId }).limit(100),
      Inventory.find({ userId }).limit(100)
    ]);

    const stats = {
      contacts: {
        total: contacts.length,
        byStatus: contacts.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {}),
        recentlyAdded: contacts.filter(c => 
          new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      },
      deals: {
        total: deals.length,
        totalValue: deals.reduce((sum, d) => sum + d.value, 0),
        byStage: deals.reduce((acc, d) => {
          acc[d.stage] = (acc[d.stage] || 0) + 1;
          return acc;
        }, {}),
        avgDealSize: deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0
      },
      inventory: {
        total: inventory.length,
        totalValue: inventory.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0),
        lowStock: inventory.filter(i => i.quantity <= i.reorderPoint).length,
        outOfStock: inventory.filter(i => i.quantity === 0).length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get AI-powered insights
 */
exports.getAIInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    const [contacts, deals] = await Promise.all([
      Contact.find({ userId }).limit(100),
      Deal.find({ userId }).populate('contactId').limit(100)
    ]);

    const insights = await geminiService.analyzeCRMData(contacts, deals);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new contact
 */
exports.createContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const contactData = { ...req.body, userId };

    const contact = new Contact(contactData);
    await contact.save();

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all contacts
 */
exports.getContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') }
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update contact
 */
exports.updateContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Score leads using AI
 */
exports.scoreLeads = async (req, res) => {
  try {
    const userId = req.user.id;
    const contacts = await Contact.find({ userId, status: 'lead' }).limit(50);

    const scores = await geminiService.scoreLeads(contacts);

    // Update contact scores
    if (scores.scores && Array.isArray(scores.scores)) {
      for (const scoreData of scores.scores) {
        await Contact.findOneAndUpdate(
          { userId, email: scoreData.email },
          { score: scoreData.score, aiInsights: scoreData.reasoning }
        );
      }
    }

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    logger.error('Score leads error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Generate personalized email
 */
exports.generateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId, context } = req.body;

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    const email = await geminiService.generateEmail(contact, context);

    res.json({
      success: true,
      data: { email }
    });
  } catch (error) {
    logger.error('Generate email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new deal
 */
exports.createDeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const dealData = { ...req.body, userId };

    const deal = new Deal(dealData);
    await deal.save();

    res.status(201).json({
      success: true,
      data: deal
    });
  } catch (error) {
    logger.error('Create deal error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all deals
 */
exports.getDeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { stage, page = 1, limit = 20 } = req.query;

    const query = { userId };
    if (stage) query.stage = stage;

    const deals = await Deal.find(query)
      .populate('contactId', 'firstName lastName email company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Deal.countDocuments(query);

    res.json({
      success: true,
      data: {
        deals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get deals error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update deal
 */
exports.updateDeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deal = await Deal.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    logger.error('Update deal error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Analyze deal probability
 */
exports.analyzeDeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deal = await Deal.findOne({ _id: id, userId }).populate('contactId');
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    const analysis = await geminiService.analyzeDealProbability(
      deal,
      deal.contactId,
      deal.activities
    );

    // Update deal with AI prediction
    deal.aiPrediction = {
      winProbability: analysis.winProbability,
      recommendedActions: analysis.recommendedActions,
      riskFactors: analysis.riskFactors,
      lastAnalyzed: new Date()
    };
    await deal.save();

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Analyze deal error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get inventory items
 */
exports.getInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category, page = 1, limit = 20 } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (category) query.category = category;

    const items = await Inventory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Inventory.countDocuments(query);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create inventory item
 */
exports.createInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemData = { ...req.body, userId };

    const item = new Inventory(itemData);
    await item.save();

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Create inventory error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update inventory item
 */
exports.updateInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const item = await Inventory.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Update status based on quantity
    if (item.quantity === 0) {
      item.status = 'out_of_stock';
    } else if (item.quantity <= item.reorderPoint) {
      item.status = 'low_stock';
    } else {
      item.status = 'in_stock';
    }
    await item.save();

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Update inventory error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Predict inventory needs using AI
 */
exports.predictInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await Inventory.find({ userId }).limit(100);

    const predictions = await geminiService.predictInventoryNeeds(items);

    // Update items with predictions
    if (predictions.predictions && Array.isArray(predictions.predictions)) {
      for (const pred of predictions.predictions) {
        await Inventory.findOneAndUpdate(
          { userId, sku: pred.sku },
          {
            aiPredictions: {
              forecastedDemand: pred.forecastedDemand,
              recommendedReorderDate: pred.recommendedReorderDate,
              optimalQuantity: pred.optimalQuantity,
              lastAnalyzed: new Date()
            }
          }
        );
      }
    }

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    logger.error('Predict inventory error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Execute agentic tool
 */
exports.executeAgenticTool = async (req, res) => {
  try {
    const { toolName, parameters } = req.body;

    const result = await geminiService.executeAgenticTool(toolName, parameters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Execute agentic tool error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
