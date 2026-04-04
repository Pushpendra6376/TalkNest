import express from "express";
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

router.post("/register", register);
router.post("/login", login);
router.post("/getotp", sendotp);
router.get("/me", fetchuser, authUser);
router.post("/send-verification-otp", fetchuser, sendVerificationOtp);
router.post("/verify-email", fetchuser, verifyEmail);

export default router;