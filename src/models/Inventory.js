const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reorderPoint: {
    type: Number,
    default: 10
  },
  reorderQuantity: {
    type: Number,
    default: 50
  },
  unitPrice: {
    type: Number,
    required: true,
    default: 0
  },
  costPrice: {
    type: Number,
    default: 0
  },
  supplier: {
    name: String,
    contactPerson: String,
    email: String,
    phone: String
  },
  location: {
    warehouse: String,
    aisle: String,
    shelf: String
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock'
  },
  lastRestocked: {
    type: Date
  },
  aiPredictions: {
    forecastedDemand: Number,
    recommendedReorderDate: Date,
    predictedStockoutDate: Date,
    optimalQuantity: Number,
    lastAnalyzed: Date
  },
  history: [{
    action: {
      type: String,
      enum: ['stock_in', 'stock_out', 'adjustment', 'return']
    },
    quantity: Number,
    date: Date,
    reason: String,
    performedBy: String
  }],
  images: [{
    url: String,
    alt: String
  }],
  tags: [String]
}, {
  timestamps: true
});

inventorySchema.index({ userId: 1, status: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ quantity: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
