import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  authUser,
  sendotp,
  sendVerificationOtp,
  verifyEmail,
} from "../controllers/auth.controller.js";
import fetchuser from "../middlewares/fetchUser.js";

const router = express.Router();

// Fix: Rate limiting on OTP endpoints to prevent spam/abuse
// Max 5 OTP requests per IP per 15 minutes
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many OTP requests. Please wait 15 minutes before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// General auth rate limiter — 20 requests per 15 minutes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.post("/getotp", otpRateLimit, sendotp);
router.get("/me", fetchuser, authUser);
router.post("/send-verification-otp", fetchuser, otpRateLimit, sendVerificationOtp);
router.post("/verify-email", fetchuser, verifyEmail);

export default router;