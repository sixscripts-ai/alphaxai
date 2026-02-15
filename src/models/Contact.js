const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['lead', 'prospect', 'customer', 'inactive'],
    default: 'lead'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social', 'event', 'cold_outreach', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  socialProfiles: {
    linkedin: String,
    twitter: String,
    facebook: String,
    website: String
  },
  dealValue: {
    type: Number,
    default: 0
  },
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  },
  notes: {
    type: String
  },
  aiInsights: {
    type: String
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  }
}, {
  timestamps: true
});

contactSchema.index({ userId: 1, email: 1 }, { unique: true });
contactSchema.index({ status: 1 });
contactSchema.index({ tags: 1 });

module.exports = mongoose.model('Contact', contactSchema);
