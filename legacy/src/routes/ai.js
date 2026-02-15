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

const router = express.Router();

// AI Generation Routes
router.post('/generate/text', protect, generateText);
router.post('/generate/embedding', protect, generateEmbedding);
router.post('/analyze/image', protect, analyzeImage);
router.post('/classify/text', protect, classifyText);
router.post('/summarize/text', protect, summarizeText);

// Conversation Routes
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversation);
router.post('/conversations', protect, createConversation);
router.put('/conversations/:id', protect, updateConversation);
router.delete('/conversations/:id', protect, deleteConversation);
router.post('/conversations/:id/chat', protect, chatWithAI);

module.exports = router;