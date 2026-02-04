import * as AuthService from '../services/auth.service.js';
import * as OtpService from '../services/otp.service.js';
import * as MailService from '../services/mail.service.js';
import User from '../models/user.model.js';
import PasswordReset from '../models/passwordReset.model.js';
import crypto from 'crypto';
import { hashPassword } from '../utils/hash.util.js';
import * as OAuthService from '../services/oauth.service.js';
import AuthProvider from '../models/authProvider.model.js';

// --- A. Registration ---
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // 1. Create User
    const user = await AuthService.registerUser({ name, email, phone, password });

    // 2. If email present, send OTP
    if (email) {
      const otp = await OtpService.generateOtp(email, 'VERIFICATION');
      await MailService.sendOtpEmail(email, otp);
    }

    res.status(201).json({ 
      message: "User registered. Please check email/phone for verification OTP.",
      userId: user.id 
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Verify OTP & Activate ---
export const verifyAccount = async (req, res) => {
  try {
    const { identifier, otp } = req.body; // Identifier = email or phone

    const isValid = await OtpService.verifyOtp(identifier, otp, 'VERIFICATION');
    if (!isValid) return res.status(400).json({ message: "Invalid or Expired OTP" });

    // Activate User
    const user = await User.findOne({ where: { [identifier.includes('@') ? 'email' : 'phone']: identifier } });
    user.isVerified = true;
    await user.save();

    // Send Welcome Email
    if (user.email) {
        await MailService.sendWelcomeEmail(user.email, user.name);
    }

    res.json({ message: "Account verified successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- B. Login ---
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const { user, token } = await AuthService.loginUser(identifier, password);
    
    res.json({ 
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};


// --- C. Social Login (Google/Facebook) ---
export const socialLogin = async (req, res) => {
  try {
    const { provider, token } = req.body; // frontend se { provider: 'google', token: '...' } aayega
    
    let profile;

    // 1. Verify Token based on provider
    if (provider === 'google') {
      profile = await OAuthService.verifyGoogleToken(token);
    } else if (provider === 'facebook') {
      profile = await OAuthService.verifyFacebookToken(token);
    } else {
      return res.status(400).json({ message: "Invalid Provider" });
    }

    // 2. Check if user exists by Email
    let user = await User.findOne({ where: { email: profile.email } });

    if (!user) {
      // Create new user if not exists
      user = await User.create({
        name: profile.name,
        email: profile.email,
        isVerified: true, // Social logins are trusted/verified
        profilePic: profile.picture
      });
    }

    // 3. Link Auth Provider (store Google/FB ID)
    // Check if this provider is already linked
    const existingAuth = await AuthProvider.findOne({
      where: { userId: user.id, provider: provider }
    });

    if (!existingAuth) {
      await AuthProvider.create({
        userId: user.id,
        provider: provider,
        providerId: profile.providerId
      });
    }

    // 4. Generate Token & Login
    const jwtToken = generateToken(user.id);

    res.json({
      message: "Social Login Successful",
      token: jwtToken,
      user: { id: user.id, name: user.name, email: user.email, profilePic: user.profilePic }
    });

  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};


// --- D. Forgot Password (Link) ---
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate Link Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await PasswordReset.create({ email, token: resetToken, expiresAt });

    const link = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${email}`;
    await MailService.sendEmail(email, "Reset Password", `<a href="${link}">Click here to reset password</a>`);

    res.json({ message: "Password reset link sent to email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    // Verify Token in DB
    const record = await PasswordReset.findOne({ where: { email, token } });
    if (!record || new Date() > record.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired link" });
    }

    // Update Password
    const user = await User.findOne({ where: { email } });
    user.password = await hashPassword(newPassword);
    await user.save();

    // Delete used token
    await record.destroy();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- E. Delete Account (Request OTP) ---
export const requestDeleteAccount = async (req, res) => {
  try {
    const { email } = req.user; // From Middleware
    const otp = await OtpService.generateOtp(email, 'DELETE_ACCOUNT');
    await MailService.sendOtpEmail(email, otp);
    res.json({ message: "OTP sent for account deletion." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- E. Confirm Delete Account ---
export const confirmDeleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    const { email, id } = req.user;

    const isValid = await OtpService.verifyOtp(email, otp, 'DELETE_ACCOUNT');
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

    await User.destroy({ where: { id } });
    res.json({ message: "Account deleted permanently." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};