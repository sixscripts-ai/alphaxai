const mongoose = require('mongoose');

const DatasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a dataset name'],
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'csv', 'json', 'mixed'],
    required: true
  },
  format: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  recordCount: {
    type: Number,
    default: 0
  },
  filePath: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  metadata: {
    columns: [String],
    encoding: String,
    delimiter: String,
    hasHeader: Boolean,
    schema: mongoose.Schema.Types.Mixed,
    statistics: mongoose.Schema.Types.Mixed
  },
  preprocessing: {
    steps: [{
      type: String,
      parameters: mongoose.Schema.Types.Mixed,
      appliedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isProcessed: {
      type: Boolean,
      default: false
    },
    processedFilePath: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'error'],
    default: 'uploading'
  },
  errorMessage: String,
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
DatasetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add preprocessing step
DatasetSchema.methods.addPreprocessingStep = function(type, parameters) {
  this.preprocessing.steps.push({
    type,
    parameters,
    appliedAt: new Date()
  });
  this.updatedAt = new Date();
};

// Mark as processed
DatasetSchema.methods.markAsProcessed = function(processedFilePath) {
  this.preprocessing.isProcessed = true;
  this.preprocessing.processedFilePath = processedFilePath;
  this.status = 'ready';
  this.updatedAt = new Date();
};

// Increment download count
DatasetSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.updatedAt = new Date();
};

module.exports = mongoose.model('Dataset', DatasetSchema);