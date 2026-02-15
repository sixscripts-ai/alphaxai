const express = require('express');
const {
  generateText,
  generateEmbedding,
  analyzeImage,
  classifyText,
  summarizeText,
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  chatWithAI
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { attachOrganization, enforcePlanLimit } = require('../middleware/tenant');

const router = express.Router();

// AI Generation Routes
router.post('/generate/text', protect, attachOrganization, enforcePlanLimit, generateText);
router.post('/generate/embedding', protect, attachOrganization, enforcePlanLimit, generateEmbedding);
router.post('/analyze/image', protect, attachOrganization, enforcePlanLimit, analyzeImage);
router.post('/classify/text', protect, attachOrganization, enforcePlanLimit, classifyText);
router.post('/summarize/text', protect, attachOrganization, enforcePlanLimit, summarizeText);

// Conversation Routes
router.get('/conversations', protect, attachOrganization, getConversations);
router.get('/conversations/:id', protect, attachOrganization, getConversation);
router.post('/conversations', protect, attachOrganization, createConversation);
router.put('/conversations/:id', protect, attachOrganization, updateConversation);
router.delete('/conversations/:id', protect, attachOrganization, deleteConversation);
router.post('/conversations/:id/chat', protect, attachOrganization, enforcePlanLimit, chatWithAI);

module.exports = router;
