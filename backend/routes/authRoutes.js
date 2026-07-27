const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../utils/authValidation');

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.get('/me', protect, getMe);

module.exports = router;
