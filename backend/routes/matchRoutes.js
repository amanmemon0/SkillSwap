const express = require('express');
const { protect } = require('../middleware/auth');
const { getCompatibility } = require('../controllers/matchController');

const router = express.Router();

// Compatibility is always calculated for the authenticated user and the requested user.
router.get('/matches/:userId', protect, getCompatibility);

module.exports = router;
