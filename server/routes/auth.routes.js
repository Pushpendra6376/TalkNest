import express from "express";
import {register, login} from "../controllers/auth.controller.js"

const router = express.Router();

// @route   POST /api/auth/register
router.post("/register", register);

// @route   POST /api/auth/login
router.post("/login", login);

// @route   POST /api/auth/forgot-password
// router.post("/forgot-password", authController.forgotPassword);

export default router;
