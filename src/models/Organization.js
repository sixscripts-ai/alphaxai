const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an organization name'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  plan: {
    type: String,
    enum: ['starter', 'growth', 'enterprise'],
    default: 'starter'
  },
  settings: {
    enforceMfa: {
      type: Boolean,
      default: false
    },
    ssoEnabled: {
      type: Boolean,
      default: false
    },
    dataResidency: {
      type: String,
      enum: ['us', 'eu', 'apac'],
      default: 'us'
    }
  },
  usage: {
    monthlyRequests: {
      type: Number,
      default: 0
    },
    monthlyResetAt: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

OrganizationSchema.methods.resetUsageIfNeeded = function resetUsageIfNeeded() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (this.usage.monthlyResetAt < monthStart) {
    this.usage.monthlyRequests = 0;
    this.usage.monthlyResetAt = monthStart;
  }
};

module.exports = mongoose.model('Organization', OrganizationSchema);
