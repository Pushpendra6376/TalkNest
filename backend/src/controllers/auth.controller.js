import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { JWT_SECRET, EMAIL, PASSWORD } from "../secrets.js";

let mailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL,
    pass: PASSWORD,
  },
  connectionTimeout: 120000,
  greetingTimeout: 120000,
  socketTimeout: 120000
});


const register = async (req, res) => {
  // Registration involves 3 dependent DB writes:
  //   1. Create the new user
  //   2. Create a personal AI bot user tied to this account
  //   3. Create the initial conversation between the user and their bot
  //
  // All three must succeed together. We use manual compensation: track every
  // record that gets created and delete them all if any subsequent step fails,
  // leaving the DB in a clean state (no partial accounts).
  let newUser = null;
  let botUser = null;

  try {
    console.log("register request received");

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    var imageUrl = `https://ui-avatars.com/api/?name=${name}&background=random&bold=true`;

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(password, salt);

    // Write 1: create the real user account
    newUser = await User.create({
      name,
      email,
      password: secPass,
      profilePic: imageUrl,
      about: "Hello World!!",
    });

    // Write 2: create the dedicated bot user for this account.
    // Each real user gets their own bot instance so conversations stay isolated.
    // Fix: bot email was "email + bot" which is not a valid email format.
    // Using a proper internal domain format instead.
    botUser = await User.create({
      name: "AI Chatbot",
      email: `bot.${newUser.id}@talknest.internal`,
      password: secPass,
      about: "I am an AI Chatbot to help you",
      profilePic:
        "https://play-lh.googleusercontent.com/Oe0NgYQ63TGGEr7ViA2fGA-yAB7w2zhMofDBR3opTGVvsCFibD8pecWUjHBF_VnVKNdJ",
      isBot: true,
      isEmailVerified: true, // bots are system accounts — no email verification needed
    });

    // Write 3: create the initial conversation between the user and their bot
    await Conversation.create({
      members: [newUser.id, botUser.id],
      unreadCounts: [
        { userId: newUser.id, count: 0 },
        { userId: botUser.id, count: 0 },
      ],
    });

    const data = {
      user: {
        id: newUser.id,
      },
    };

    const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "7d" });

    // Fix: register now returns user data so frontend doesn't need an extra /me call
    res.json({
      authtoken,
      user: {
        _id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        profilePic: newUser.profilePic,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (error) {
    // Something went wrong during one of the DB writes.
    // Manually delete any documents that were already created so we don't
    // leave behind partial data (e.g. a user with no bot, or a bot with no
    // conversation). This is the compensation step in lieu of a transaction.
    try {
      if (newUser) await User.destroy({ where: { id: newUser.id } });
      if (botUser) await User.destroy({ where: { id: botUser.id } });
    } catch (cleanupError) {
      // Log but don't mask the original error
      console.error("Cleanup after failed registration also failed:", cleanupError.message);
    }
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  console.log("login request received");

  try {
    const { email, password, otp } = req.body;

    if (!email || (!password && !otp)) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    // Fix: exclude deleted users from login
    const user = await User.findOne({
      where: { email: email, isDeleted: false },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid Credentials",
      });
    }

    if (otp) {
      // Check expiry BEFORE bcrypt.compare so expired OTPs are rejected immediately
      if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
        return res.status(400).json({ error: "OTP expired or not found. Please request a new one." });
      }
      const isValidOtp = await bcrypt.compare(otp.toString(), user.otp);
      if (!isValidOtp) {
        return res.status(400).json({
          error: "Invalid otp",
        });
      }
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
    } else {
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({
          error: "Invalid Credentials",
        });
      }
    }

    const data = {
      user: {
        id: user.id,
      },
    };

    const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      authtoken,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const authUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "otp", "otpExpiry"] },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const sendotp = async (req, res) => {
  try {
    console.log("sendotp request received");
    // Fix: use destructured email consistently (was mixing req.body.email and email)
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp.toString(), salt);
    user.otp = hashedOtp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
    await user.save();

    let mailDetails = {
      from: `"TalkNest" <${EMAIL}>`,
      to: email,
      subject: "Your TalkNest Login OTP - " + otp,
      html: `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Your TalkNest OTP</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
        <td align="center" style="background-color:#6366f1;padding:36px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px;">TalkNest</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">online chatting platform</p>
        </td>
        </tr>

        <!-- Body -->
        <tr>
        <td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hello,</p>
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
          We received a request to sign in to your TalkNest account. Use the one-time password below to complete your login.
          </p>

          <!-- OTP Box -->
          <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="background-color:#f5f3ff;border:2px dashed #8b5cf6;border-radius:10px;padding:24px;">
            <p style="margin:0 0 6px;font-size:12px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">One-Time Password</p>
            <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:10px;color:#6366f1;">${otp}</p>
            </td>
          </tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">
          This OTP is valid for <strong style="color:#374151;">5 minutes</strong>. Do not share it with anyone.
          </p>
        </td>
        </tr>

        <!-- Warning -->
        <tr>
        <td style="padding:0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;padding:12px 16px;">
            <p style="margin:0;font-size:13px;color:#92400e;">
              If you did not request this OTP, you can safely ignore this email. Your account remains secure.
            </p>
            </td>
          </tr>
          </table>
        </td>
        </tr>

        <!-- Footer -->
        <tr>
        <td align="center" style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
          &copy; ${new Date().getFullYear()} TalkNest. All rights reserved.
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
          This is an automated message — please do not reply.
          </p>
        </td>
        </tr>

      </table>
      </td>
    </tr>
    </table>
  </body>
  </html>`,
    };

    try {
      await mailTransporter.sendMail(mailDetails);
      return res.status(200).json({ message: "OTP sent" });
    } catch (err) {
      console.error("Mail error:", err);
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const sendVerificationOtp = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isEmailVerified)
      return res.status(400).json({ error: "Email is already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("sendVerificationOtp: Generated raw OTP:", otp);
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp.toString(), salt);
    user.otp = hashedOtp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();
    console.log("sendVerificationOtp: Saved OTP hash to DB:", user.otp, "Expiry:", user.otpExpiry);

    const mailDetails = {
      from: `"TalkNest" <${EMAIL}>`,
      to: user.email,
      subject: `Verify your TalkNest email – OTP: ${otp}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td align="center" style="background-color:#6366f1;padding:36px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:0.5px;">TalkNest</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Verify your email address</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hello ${user.name},</p>
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                Please use the OTP below to verify your email address and unlock full access to TalkNest.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#f5f3ff;border:2px dashed #8b5cf6;border-radius:10px;padding:24px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Verification Code</p>
                    <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:10px;color:#6366f1;">${otp}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">
                This code is valid for <strong style="color:#374151;">10 minutes</strong>. Do not share it with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">
                      If you did not sign up for TalkNest, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} TalkNest. All rights reserved.</p>
              <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">This is an automated message — please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    };

    try {
      await mailTransporter.sendMail(mailDetails);
      return res.status(200).json({ message: "Verification OTP sent" });
    } catch (err) {
      console.error("Mail error:", err);
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log("verifyEmail request received. Entered OTP:", otp);
    if (!otp) return res.status(400).json({ error: "OTP is required" });

    const user = await User.findByPk(req.user.id);
    if (!user) {
      console.log("verifyEmail error: User not found for ID:", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }
    if (user.isEmailVerified) {
      console.log("verifyEmail error: Email already verified for User:", user.email);
      return res.status(400).json({ error: "Email is already verified" });
    }

    console.log("verifyEmail DB status:", {
      storedOtpHash: user.otp,
      otpExpiry: user.otpExpiry,
      currentTime: new Date(),
      isExpired: user.otpExpiry ? user.otpExpiry < new Date() : true
    });

    if (!user.otp || !user.otpExpiry) {
      console.log("verifyEmail error: No OTP or expiry in DB");
      return res.status(400).json({ error: "No OTP found. Please request a new one." });
    }

    if (user.otpExpiry < new Date()) {
      console.log("verifyEmail error: OTP expired. Expiry:", user.otpExpiry, "Current:", new Date());
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    const isValid = await bcrypt.compare(otp.toString(), user.otp);
    console.log("verifyEmail bcrypt result:", isValid);
    if (!isValid) {
      console.log("verifyEmail error: Invalid OTP (bcrypt comparison failed)");
      return res.status(400).json({ error: "Invalid OTP" });
    }

    user.isEmailVerified = true;
    // Fix: was setting otp to "" (empty string) — now consistently uses null
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    console.log("verifyEmail success: Email verified for User:", user.email);
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("verifyEmail internal error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  register,
  login,
  authUser,
  sendotp,
  sendVerificationOtp,
  verifyEmail,
};