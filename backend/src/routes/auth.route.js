import express from "express";
import { register, login, logout, verifyLoginOtp } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login); // credentials -> OTP send
router.post("/login/verify-otp", verifyLoginOtp); // OTP validate -> token
router.post("/logout", logout);

export default router;