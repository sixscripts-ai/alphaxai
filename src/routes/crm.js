const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmTursoController');
const { protect } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', protect, crmController.getDashboard);
router.get('/insights', protect, crmController.getAIInsights);

// Contacts
router.post('/contacts', protect, crmController.createContact);
router.get('/contacts', protect, crmController.getContacts);
router.put('/contacts/:id', protect, crmController.updateContact);
router.post('/contacts/score', protect, crmController.scoreLeads);
router.post('/contacts/generate-email', protect, crmController.generateEmail);

// Deals
router.post('/deals', protect, crmController.createDeal);
router.get('/deals', protect, crmController.getDeals);
router.put('/deals/:id', protect, crmController.updateDeal);
router.post('/deals/:id/analyze', protect, crmController.analyzeDeal);

// Inventory
router.get('/inventory', protect, crmController.getInventory);
router.post('/inventory', protect, crmController.createInventoryItem);
router.put('/inventory/:id', protect, crmController.updateInventoryItem);
router.post('/inventory/predict', protect, crmController.predictInventory);

// Agentic Tools
router.post('/agent/execute', protect, crmController.executeAgenticTool);

module.exports = router;
