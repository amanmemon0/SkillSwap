const express = require('express');
const { registerUser, loginUser, getMe, updateProfile, getAllUsers, adminUpdateUser, adminDeleteUser } = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../utils/authValidation');

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/admin/users', protect, isAdmin, getAllUsers);
router.put('/admin/users/:id', protect, isAdmin, adminUpdateUser);
router.delete('/admin/users/:id', protect, isAdmin, adminDeleteUser);

module.exports = router;


