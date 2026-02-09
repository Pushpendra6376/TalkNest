const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user (via Email or Phone)
router.post('/login', authController.login);

// @route   POST api/auth/forgot-password
// @desc    Send password reset link
// router.post('/forgot-password', authController.forgotPassword); 

module.exports = router;