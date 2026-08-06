const express = require('express');
const { createExchange, getExchanges, updateExchangeStatus } = require('../controllers/exchangeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createExchange);
router.get('/', protect, getExchanges);
router.put('/:id/status', protect, updateExchangeStatus);

module.exports = router;
