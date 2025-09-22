const express = require('express');
const multer = require('multer');
const {
  uploadDataset,
  getDatasets,
  getDataset,
  updateDataset,
  deleteDataset,
  downloadDataset,
  preprocessDataset,
  getDatasetStats
} = require('../controllers/dataController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination (req, file, cb) {
    cb(null, 'uploads/datasets/');
  },
  filename (req, file, cb) {
    const uniqueSuffix = `${Date.now()  }-${  Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname  }-${  uniqueSuffix  }.${  file.originalname.split('.').pop()}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|csv|json|xlsx|xls|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and data files are allowed.'));
    }
  }
});

router.use(protect); // All routes need authentication

router.post('/upload', upload.single('dataset'), uploadDataset);
router.get('/', getDatasets);
router.get('/stats', getDatasetStats);
router.get('/:id', getDataset);
router.put('/:id', updateDataset);
router.delete('/:id', deleteDataset);
router.get('/:id/download', downloadDataset);
router.post('/:id/preprocess', preprocessDataset);

module.exports = router;