import { sendEmail } from "../config/brevoEmail.js";

export const sendForgotPasswordEmail = async (userEmail, userName, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const subject = "Password Reset Request - TalkNest";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .reset-icon {
            font-size: 48px;
            color: #3498db;
            margin-bottom: 20px;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 24px;
          }
          .info-text {
            background-color: #e8f4fd;
            border: 1px solid #b3d9ff;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #2c3e50;
          }
          .reset-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          .reset-button:hover {
            background-color: #2980b9;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .security-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 10px;
            margin: 15px 0;
            font-size: 13px;
            color: #856404;
          }
          .link-text {
            word-break: break-all;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="reset-icon">🔐</div>
            <h1>Password Reset Request</h1>
          </div>

          <p>Hi <strong>${userName}</strong>,</p>

          <div class="info-text">
            We received a request to reset your password for your TalkNest account. If you made this request, click the button below to reset your password.
          </div>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">
              Reset Your Password
            </a>
          </div>

          <p>This password reset link will expire in <strong>1 hour</strong> for security reasons.</p>

          <div class="security-note">
            <strong>Security Note:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged, and no one has accessed your account.
          </div>

          <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
          <div class="link-text">${resetUrl}</div>

          <p>If you have any questions or need help, please contact our support team.</p>

          <div class="footer">
            <p>This is an automated message from TalkNest. Please do not reply to this email.</p>
            <p>For security reasons, this link can only be used once and will expire soon.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: userEmail,
      subject,
      htmlContent,
    });

    console.log(`Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};
