const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  value: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  stage: {
    type: String,
    enum: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'prospecting'
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  expectedCloseDate: {
    type: Date
  },
  actualCloseDate: {
    type: Date
  },
  products: [{
    name: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  notes: {
    type: String
  },
  aiPrediction: {
    winProbability: Number,
    recommendedActions: [String],
    riskFactors: [String],
    lastAnalyzed: Date
  },
  activities: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'task']
    },
    description: String,
    date: Date,
    outcome: String
  }]
}, {
  timestamps: true
});

dealSchema.index({ userId: 1, stage: 1 });
dealSchema.index({ expectedCloseDate: 1 });

module.exports = mongoose.model('Deal', dealSchema);
