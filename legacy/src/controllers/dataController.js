const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Dataset = require('../models/Dataset');
const { asyncHandler } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/datasets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload dataset
// @route   POST /api/data/upload
// @access  Private
const uploadDataset = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Please upload a file'
    });
  }

  const { name, description, type, tags } = req.body;

  // Analyze file metadata
  const stats = fs.statSync(req.file.path);
  let recordCount = 0;
  let columns = [];

  // For CSV files, analyze structure
  if (req.file.mimetype === 'text/csv') {
    try {
      const results = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          if (recordCount === 0) {
            columns = Object.keys(data);
          }
          recordCount++;
          if (recordCount <= 1000) { // Sample first 1000 rows
            results.push(data);
          }
        })
        .on('end', async () => {
          const dataset = await Dataset.create({
            name: name || req.file.originalname,
            description,
            user: req.user.id,
            type: type || 'csv',
            format: path.extname(req.file.originalname),
            size: stats.size,
            recordCount,
            filePath: req.file.path,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            metadata: {
              columns,
              hasHeader: true,
              delimiter: ',',
              encoding: 'utf8'
            },
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            status: 'ready'
          });

          logger.info(`Dataset uploaded by user: ${req.user.email}`);

          res.status(201).json({
            success: true,
            data: dataset
          });
        });
    } catch (error) {
      logger.error('Error analyzing CSV file:', error);
      return res.status(500).json({
        success: false,
        error: 'Error analyzing file'
      });
    }
  } else {
    // For other file types
    const dataset = await Dataset.create({
      name: name || req.file.originalname,
      description,
      user: req.user.id,
      type: type || 'file',
      format: path.extname(req.file.originalname),
      size: stats.size,
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: 'ready'
    });

    logger.info(`Dataset uploaded by user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: dataset
    });
  }
});

// @desc    Get user datasets
// @route   GET /api/data
// @access  Private
const getDatasets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { user: req.user.id };

  // Add filters
  if (req.query.type) {
    query.type = req.query.type;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.tags) {
    query.tags = { $in: req.query.tags.split(',') };
  }

  const datasets = await Dataset.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Dataset.countDocuments(query);

  res.status(200).json({
    success: true,
    data: datasets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single dataset
// @route   GET /api/data/:id
// @access  Private
const getDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    $or: [
      { user: req.user.id },
      { isPublic: true }
    ]
  });

  if (!dataset) {
    return res.status(404).json({
      success: false,
      error: 'Dataset not found'
    });
  }

  res.status(200).json({
    success: true,
    data: dataset
  });
});

// @desc    Update dataset
// @route   PUT /api/data/:id
// @access  Private
const updateDataset = asyncHandler(async (req, res) => {
  let dataset = await Dataset.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!dataset) {
    return res.status(404).json({
      success: false,
      error: 'Dataset not found'
    });
  }

  dataset = await Dataset.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: dataset
  });
});

// @desc    Delete dataset
// @route   DELETE /api/data/:id
// @access  Private
const deleteDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!dataset) {
    return res.status(404).json({
      success: false,
      error: 'Dataset not found'
    });
  }

  // Delete file from filesystem
  if (fs.existsSync(dataset.filePath)) {
    fs.unlinkSync(dataset.filePath);
  }

  await dataset.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Dataset deleted'
  });
});

// @desc    Download dataset
// @route   GET /api/data/:id/download
// @access  Private
const downloadDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    $or: [
      { user: req.user.id },
      { isPublic: true }
    ]
  });

  if (!dataset) {
    return res.status(404).json({
      success: false,
      error: 'Dataset not found'
    });
  }

  if (!fs.existsSync(dataset.filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }

  // Increment download count
  dataset.incrementDownload();
  await dataset.save();

  res.download(dataset.filePath, dataset.originalName);
});

// @desc    Preprocess dataset
// @route   POST /api/data/:id/preprocess
// @access  Private
const preprocessDataset = asyncHandler(async (req, res) => {
  const { steps } = req.body;

  const dataset = await Dataset.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!dataset) {
    return res.status(404).json({
      success: false,
      error: 'Dataset not found'
    });
  }

  // Add preprocessing steps
  if (steps && Array.isArray(steps)) {
    steps.forEach(step => {
      dataset.addPreprocessingStep(step.type, step.parameters);
    });
  }

  await dataset.save();

  res.status(200).json({
    success: true,
    data: dataset,
    message: 'Preprocessing steps added'
  });
});

// @desc    Get dataset statistics
// @route   GET /api/data/stats
// @access  Private
const getDatasetStats = asyncHandler(async (req, res) => {
  const totalDatasets = await Dataset.countDocuments({ user: req.user.id });
  const totalSize = await Dataset.aggregate([
    { $match: { user: req.user.id } },
    { $group: { _id: null, totalSize: { $sum: '$size' } } }
  ]);

  const typeStats = await Dataset.aggregate([
    { $match: { user: req.user.id } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalDatasets,
      totalSize: totalSize[0]?.totalSize || 0,
      typeStats: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    }
  });
});

module.exports = {
  uploadDataset,
  getDatasets,
  getDataset,
  updateDataset,
  deleteDataset,
  downloadDataset,
  preprocessDataset,
  getDatasetStats
};