const express = require('express');
const {
  registerUser, loginUser, forgotPassword, resetPassword,
  getMe, updateProfile, getPublicProfiles, getAllUsers,
  getAdminTableData, adminUpdateUser, adminDeleteUser,
} = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerSchema, loginSchema, requestPasswordResetSchema,
  resetPasswordSchema, profileUpdateSchema, adminUserUpdateSchema,
} = require('../utils/authValidation');

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

// Two-step secure password reset
router.post('/forgot-password', validate(requestPasswordResetSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, validate(profileUpdateSchema), updateProfile);
router.get('/profiles', getPublicProfiles);

// Admin routes
router.get('/admin/users', protect, isAdmin, getAllUsers);
router.get('/admin/tables/:table', protect, isAdmin, getAdminTableData);
router.put('/admin/users/:id', protect, isAdmin, validate(adminUserUpdateSchema), adminUpdateUser);
router.delete('/admin/users/:id', protect, isAdmin, adminDeleteUser);

module.exports = router;
