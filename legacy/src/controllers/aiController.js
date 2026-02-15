const aiService = require('../services/aiService');
const Conversation = require('../models/Conversation');
const { asyncHandler } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

// @desc    Generate text using AI
// @route   POST /api/ai/generate/text
// @access  Private
const generateText = asyncHandler(async (req, res) => {
  const { prompt, options } = req.body;

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a prompt'
    });
  }

  // Update user API usage
  req.user.updateApiUsage();
  await req.user.save();

  const result = await aiService.generateText(prompt, options);

  logger.info(`Text generation request by user: ${req.user.email}`);

  res.status(200).json({
    success: result.success,
    data: result.data,
    usage: result.usage,
    error: result.error
  });
});

// @desc    Generate embedding for text
// @route   POST /api/ai/generate/embedding
// @access  Private
const generateEmbedding = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Please provide text to embed'
    });
  }

  // Update user API usage
  req.user.updateApiUsage();
  await req.user.save();

  const result = await aiService.generateEmbedding(text);

  logger.info(`Embedding generation request by user: ${req.user.email}`);

  res.status(200).json({
    success: result.success,
    data: result.data,
    usage: result.usage,
    error: result.error
  });
});

// @desc    Analyze image with AI
// @route   POST /api/ai/analyze/image
// @access  Private
const analyzeImage = asyncHandler(async (req, res) => {
  const { imageUrl, prompt } = req.body;

  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      error: 'Please provide an image URL'
    });
  }

  // Update user API usage
  req.user.updateApiUsage();
  await req.user.save();

  const result = await aiService.analyzeImage(imageUrl, prompt);

  logger.info(`Image analysis request by user: ${req.user.email}`);

  res.status(200).json({
    success: result.success,
    data: result.data,
    usage: result.usage,
    error: result.error
  });
});

// @desc    Classify text
// @route   POST /api/ai/classify/text
// @access  Private
const classifyText = asyncHandler(async (req, res) => {
  const { text, labels } = req.body;

  if (!text || !labels || !Array.isArray(labels)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide text and labels array'
    });
  }

  // Update user API usage
  req.user.updateApiUsage();
  await req.user.save();

  const result = await aiService.classifyText(text, labels);

  logger.info(`Text classification request by user: ${req.user.email}`);

  res.status(200).json({
    success: result.success,
    data: result.data,
    error: result.error
  });
});

// @desc    Summarize text
// @route   POST /api/ai/summarize/text
// @access  Private
const summarizeText = asyncHandler(async (req, res) => {
  const { text, maxLength } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Please provide text to summarize'
    });
  }

  // Update user API usage
  req.user.updateApiUsage();
  await req.user.save();

  const result = await aiService.summarizeText(text, maxLength);

  logger.info(`Text summarization request by user: ${req.user.email}`);

  res.status(200).json({
    success: result.success,
    data: result.data,
    error: result.error
  });
});

// @desc    Get user conversations
// @route   GET /api/ai/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const conversations = await Conversation.find({ user: req.user.id })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-messages'); // Exclude messages for performance

  const total = await Conversation.countDocuments({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: conversations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single conversation
// @route   GET /api/ai/conversations/:id
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Create new conversation
// @route   POST /api/ai/conversations
// @access  Private
const createConversation = asyncHandler(async (req, res) => {
  const { title, settings } = req.body;

  const conversation = await Conversation.create({
    user: req.user.id,
    title: title || 'New Conversation',
    settings: settings || {}
  });

  res.status(201).json({
    success: true,
    data: conversation
  });
});

// @desc    Update conversation
// @route   PUT /api/ai/conversations/:id
// @access  Private
const updateConversation = asyncHandler(async (req, res) => {
  let conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }

  conversation = await Conversation.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Delete conversation
// @route   DELETE /api/ai/conversations/:id
// @access  Private
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }

  await conversation.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Conversation deleted'
  });
});

// @desc    Chat with AI in conversation
// @route   POST /api/ai/conversations/:id/chat
// @access  Private
const chatWithAI = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a message'
    });
  }

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }

  // Add user message
  conversation.addMessage('user', message);

  // Generate AI response
  // const context = conversation.messages.map(msg => ({
  //   role: msg.role,
  //   content: msg.content
  // }));

  // Update user API usage
  req.user.updateApiUsage();
  await req.user.save();

  const result = await aiService.generateText(message, {
    model: conversation.settings.model,
    temperature: conversation.settings.temperature,
    maxTokens: conversation.settings.maxTokens
  });

  if (result.success) {
    // Add AI response
    conversation.addMessage('assistant', result.data, {
      model: conversation.settings.model,
      tokens: result.usage?.total_tokens,
      cost: result.usage?.total_tokens * 0.002 / 1000 // Rough estimate
    });
  }

  await conversation.save();

  logger.info(`Chat message processed for user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    data: {
      conversation,
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
  createConversation,
  updateConversation,
  deleteConversation,
  chatWithAI
};