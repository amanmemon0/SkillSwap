const express = require('express');
const router = express.Router();
const { getUserProfile, listUsers, submitReview } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public
router.get('/:id', getUserProfile);

// Private
router.get('/', protect, listUsers);
router.post('/:id/reviews', protect, submitReview);

module.exports = router;
