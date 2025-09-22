const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a conversation title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      model: String,
      tokens: Number,
      processingTime: Number,
      cost: Number
    }
  }],
  settings: {
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1000,
      min: 1,
      max: 4000
    },
    systemPrompt: {
      type: String,
      default: 'You are a helpful AI assistant.'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedAt: Date,
  totalTokens: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total tokens and cost
ConversationSchema.methods.calculateTotals = function() {
  let totalTokens = 0;
  let totalCost = 0;
  
  this.messages.forEach(message => {
    if (message.metadata && message.metadata.tokens) {
      totalTokens += message.metadata.tokens;
    }
    if (message.metadata && message.metadata.cost) {
      totalCost += message.metadata.cost;
    }
  });
  
  this.totalTokens = totalTokens;
  this.totalCost = totalCost;
};

// Add a message to the conversation
ConversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata,
    timestamp: new Date()
  });
  
  this.calculateTotals();
  this.updatedAt = new Date();
};

module.exports = mongoose.model('Conversation', ConversationSchema);