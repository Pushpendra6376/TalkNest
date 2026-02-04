import express from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { loginLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Public Routes
router.post('/register', AuthController.register);
router.post('/verify-otp', AuthController.verifyAccount);
router.post('/login', loginLimiter, AuthController.login); // Rate limiter added
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/social-login', AuthController.socialLogin);
// Protected Routes (User must be logged in)
router.post('/request-delete', protect, AuthController.requestDeleteAccount);
router.delete('/confirm-delete', protect, AuthController.confirmDeleteAccount);

export default router;