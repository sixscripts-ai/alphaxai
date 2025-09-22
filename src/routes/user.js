const express = require('express');
const { getUsers, getUser, updateUser, deleteUser, getUserStats } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes need authentication

router.get('/', authorize('admin', 'moderator'), getUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;