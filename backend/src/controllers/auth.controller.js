import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import SibApiV3Sdk from "sib-api-v3-sdk";
import { Op, UniqueConstraintError, ValidationError } from "sequelize";


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

// Forgot password API
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Do not reveal whether the email exists.
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.RESET_PASSWORD_EXPIRE || '1h' }
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendResetPasswordEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
};

// Login API with credentials and JWT token
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
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const sendResetPasswordEmail = async ({ email, name, resetUrl }) => {
  const apiKey = process.env.SIB_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SIB_API_KEY in environment");
  }

  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKeyAuth = defaultClient.authentications["api-key"];
  apiKeyAuth.apiKey = apiKey;

  const emailClient = new SibApiV3Sdk.TransactionalEmailsApi();
  const senderEmail = process.env.SIB_FROM_EMAIL || "no-reply@talknest.app";
  const senderName = process.env.SIB_FROM_NAME || "TalkNest";

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
    sender: { email: senderEmail, name: senderName },
    to: [{ email, name }],
    subject: "Reset your TalkNest password",
    htmlContent: `
      <html>
        <body>
          <h1>Reset your password</h1>
          <p>Hi ${name},</p>
          <p>We received a request to reset your TalkNest password. Click the link below to choose a new password:</p>
          <p><a href="${resetUrl}" target="_blank">Reset my password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>Thanks,<br/>TalkNest Team</p>
        </body>
      </html>
    `,
  });

  await emailClient.sendTransacEmail(sendSmtpEmail);
};

//LOGOUT API
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

export default { register, login, logout, forgotPassword };