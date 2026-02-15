const aiService = require('../services/aiService');
const {
  updateUser,
  listConversations,
  countConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation
} = require('../repositories/tursoRepository');
const { asyncHandler } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const currentMonth = () => new Date().toISOString().slice(0, 7);

const incrementUsage = async (user) => {
  const month = currentMonth();
  const monthlyRequests = user.apiUsage.currentMonth === month ? user.apiUsage.monthlyRequests + 1 : 1;

  await updateUser(user.id, {
    totalRequests: user.apiUsage.totalRequests + 1,
    monthlyRequests,
    currentMonth: month,
    lastRequestAt: new Date().toISOString()
  });
};

const generateText = asyncHandler(async (req, res) => {
  const { prompt, options } = req.body;
  if (!prompt) return res.status(400).json({ success: false, error: 'Please provide a prompt' });

  await incrementUsage(req.user);
  const result = await aiService.generateText(prompt, options);

  logger.info(`Text generation request by user: ${req.user.email}`);
  return res.status(200).json({ success: result.success, data: result.data, usage: result.usage, error: result.error });
});

const generateEmbedding = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'Please provide text to embed' });

  await incrementUsage(req.user);
  const result = await aiService.generateEmbedding(text);

  logger.info(`Embedding generation request by user: ${req.user.email}`);
  return res.status(200).json({ success: result.success, data: result.data, usage: result.usage, error: result.error });
});

const analyzeImage = asyncHandler(async (req, res) => {
  const { imageUrl, prompt } = req.body;
  if (!imageUrl) return res.status(400).json({ success: false, error: 'Please provide an image URL' });

  await incrementUsage(req.user);
  const result = await aiService.analyzeImage(imageUrl, prompt);

  logger.info(`Image analysis request by user: ${req.user.email}`);
  return res.status(200).json({ success: result.success, data: result.data, usage: result.usage, error: result.error });
});

const classifyText = asyncHandler(async (req, res) => {
  const { text, labels } = req.body;
  if (!text || !labels || !Array.isArray(labels)) {
    return res.status(400).json({ success: false, error: 'Please provide text and labels array' });
  }

  await incrementUsage(req.user);
  const result = await aiService.classifyText(text, labels);

  logger.info(`Text classification request by user: ${req.user.email}`);
  return res.status(200).json({ success: result.success, data: result.data, error: result.error });
});

const summarizeText = asyncHandler(async (req, res) => {
  const { text, maxLength } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'Please provide text to summarize' });

  await incrementUsage(req.user);
  const result = await aiService.summarizeText(text, maxLength);

  logger.info(`Text summarization request by user: ${req.user.email}`);
  return res.status(200).json({ success: result.success, data: result.data, error: result.error });
});

const getConversations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const conversations = await listConversations({
    userId: req.user.id,
    organizationId: req.organization.id,
    limit,
    offset: skip
  });

  const total = await countConversations({
    userId: req.user.id,
    organizationId: req.organization.id
  });

  return res.status(200).json({
    success: true,
    data: conversations,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

const getConversation = asyncHandler(async (req, res) => {
  const conversation = await getConversationById(req.params.id, req.user.id, req.organization.id);
  if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

  return res.status(200).json({ success: true, data: conversation });
});

const createConversationHandler = asyncHandler(async (req, res) => {
  const { title, settings } = req.body;
  const conversation = await createConversation({
    userId: req.user.id,
    organizationId: req.organization.id,
    title: title || 'New Conversation',
    settings: { model: 'gemini-pro-3', temperature: 0.7, maxTokens: 2000, systemPrompt: '', ...(settings || {}) }
  });

  return res.status(201).json({ success: true, data: conversation });
});

const updateConversationHandler = asyncHandler(async (req, res) => {
  const conversation = await updateConversation(req.params.id, req.user.id, req.organization.id, req.body);
  if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

  return res.status(200).json({ success: true, data: conversation });
});

const deleteConversationHandler = asyncHandler(async (req, res) => {
  const deleted = await deleteConversation(req.params.id, req.user.id, req.organization.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Conversation not found' });

  return res.status(200).json({ success: true, message: 'Conversation deleted' });
});

const chatWithAI = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'Please provide a message' });

  const conversation = await getConversationById(req.params.id, req.user.id, req.organization.id);
  if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

  const messages = [...conversation.messages, {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
    metadata: {}
  }];

  await incrementUsage(req.user);
  const result = await aiService.generateText(message, {
    model: conversation.settings.model,
    temperature: conversation.settings.temperature,
    maxTokens: conversation.settings.maxTokens
  });

  if (result.success) {
    messages.push({
      role: 'assistant',
      content: result.data,
      timestamp: new Date().toISOString(),
      metadata: {
        model: conversation.settings.model,
        tokens: result.usage?.total_tokens,
        cost: (result.usage?.total_tokens || 0) * 0.002 / 1000
      }
    });
  }

  const totalTokens = messages.reduce((sum, entry) => sum + (entry.metadata?.tokens || 0), 0);
  const estimatedCost = messages.reduce((sum, entry) => sum + (entry.metadata?.cost || 0), 0);

  const updatedConversation = await updateConversation(req.params.id, req.user.id, req.organization.id, {
    messages,
    totalTokens,
    estimatedCost
  });

  logger.info(`Chat message processed for user: ${req.user.email}`);
  return res.status(200).json({
    success: true,
    data: {
      conversation: updatedConversation,
      aiResponse: result.data,
      error: result.error
    }
  });
});

module.exports = {
  generateText,
  generateEmbedding,
  analyzeImage,
  classifyText,
  summarizeText,
  getConversations,
  getConversation,
  createConversation: createConversationHandler,
  updateConversation: updateConversationHandler,
  deleteConversation: deleteConversationHandler,
  chatWithAI
};
