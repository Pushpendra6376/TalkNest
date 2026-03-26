import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op, UniqueConstraintError, ValidationError } from "sequelize";
import { sendLoginOTPEmail } from "../services/emails/sendLoginOTPEmail.js";

const otpStore = new Map(); // temporary in-memory OTP store
const MAX_OTP_REQUESTS = 5; // max request attempts per user per window

// Register API
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // validating input
    if(password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if(phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be at least 10 characters",
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // check existing user
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const existingPhone = await User.findOne({
      where: { phone },
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        success: false,
        message: "Email or phone already in use",
        details: error.errors.map((e) => e.message),
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: error.errors.map((e) => e.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Request login with password, then send OTP to email
export const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and password are required for login",
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: emailOrPhone },
          { phone: emailOrPhone },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

    const quota = otpStore.get(user.id) || { requests: 0 };
    if (quota.requests >= MAX_OTP_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please try again later",
      });
    }

    otpStore.set(user.id, {
      code: otp,
      expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
      requests: (quota.requests || 0) + 1,
      verified: false,
    });

    await sendLoginOTPEmail(user.email, user.name, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your registered email address. Valid for " + expiresInMinutes + " minutes",
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Verify login OTP and return token
export const verifyLoginOtp = async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    if (!emailOrPhone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and OTP are required",
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: emailOrPhone },
          { phone: emailOrPhone },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otpData = otpStore.get(user.id);
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found for this user. Please login again",
      });
    }

    if (otpData.verified) {
      return res.status(400).json({
        success: false,
        message: "OTP already used. Request a new one",
      });
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(user.id);
      return res.status(410).json({
        success: false,
        message: "OTP expired. Request a new one",
      });
    }

    if (otpData.code !== otp.toString()) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpData.verified = true;
    otpStore.set(user.id, otpData);

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//LOGOUT API
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

export default { register, login, verifyLoginOtp, logout };