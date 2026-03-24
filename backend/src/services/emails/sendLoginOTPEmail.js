import { sendEmail } from "../config/brevoEmail.js";

export const sendLoginOTPEmail = async (userEmail, userName, otpCode) => {
  try {
    const subject = `Your Login OTP - TalkNest (${otpCode})`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login OTP</title>
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
          .otp-icon {
            font-size: 48px;
            color: #27ae60;
            margin-bottom: 20px;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 24px;
          }
          .otp-code {
            background-color: #f8f9fa;
            border: 2px solid #27ae60;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #27ae60;
            font-family: 'Courier New', monospace;
          }
          .info-text {
            background-color: #e8f8f5;
            border: 1px solid #a8dadc;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #2c3e50;
          }
          .warning-text {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .security-tips {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
          }
          .security-tips ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .security-tips li {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="otp-icon">🔐</div>
            <h1>Login Verification Code</h1>
          </div>

          <p>Hi <strong>${userName}</strong>,</p>

          <div class="info-text">
            To complete your login to TalkNest, please use the verification code below:
          </div>

          <div class="otp-code">
            ${otpCode}
          </div>

          <div class="warning-text">
            <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>. Please use it immediately to complete your login.
          </div>

          <p>If you didn't request this login attempt, please ignore this email and contact our support team immediately.</p>

          <div class="security-tips">
            <strong>Security Tips:</strong>
            <ul>
              <li>Never share your verification code with anyone</li>
              <li>Do not enter this code on suspicious websites</li>
              <li>Always ensure you're on the official TalkNest login page</li>
              <li>Report any suspicious activity to our support team</li>
            </ul>
          </div>

          <p>For your security, this code can only be used once and is valid for a single login attempt.</p>

          <div class="footer">
            <p>This is an automated message from TalkNest. Please do not reply to this email.</p>
            <p>If you need help, contact our support team at support@talknest.com</p>
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

    console.log(`Login OTP email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending login OTP email:", error);
    throw new Error("Failed to send login OTP email");
  }
};
