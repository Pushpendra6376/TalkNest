import { sendEmail } from "../config/brevoEmail.js";

export const sendNewUserEmail = async (userEmail, userName) => {
  try {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const supportEmail = "support@talknest.com";

    const subject = "Welcome to TalkNest - Let's Start Connecting!";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TalkNest</title>
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
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .welcome-icon {
            font-size: 48px;
            color: #3498db;
            margin-bottom: 20px;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .subtitle {
            color: #7f8c8d;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .welcome-message {
            background-color: #e8f8f5;
            border-left: 4px solid #27ae60;
            padding: 20px;
            margin: 25px 0;
            font-size: 16px;
            line-height: 1.7;
          }
          .features-section {
            margin: 30px 0;
          }
          .feature-item {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            border-left: 3px solid #3498db;
          }
          .feature-icon {
            font-size: 20px;
            margin-right: 10px;
          }
          .cta-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            margin: 25px 0;
            transition: background-color 0.3s ease;
            font-size: 16px;
          }
          .cta-button:hover {
            background-color: #2980b9;
          }
          .tips-section {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 20px;
            margin: 25px 0;
          }
          .tips-title {
            color: #856404;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .tips-list {
            color: #856404;
            padding-left: 20px;
          }
          .tips-list li {
            margin: 5px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .social-links {
            margin: 20px 0;
          }
          .social-links a {
            color: #3498db;
            text-decoration: none;
            margin: 0 10px;
          }
          .highlight {
            background-color: #e3f2fd;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="welcome-icon">🎉</div>
            <h1>Welcome to TalkNest!</h1>
            <div class="subtitle">Your journey to better communication starts here</div>
          </div>

          <div class="welcome-message">
            Hi <strong>${userName}</strong>,<br><br>
            Welcome to <strong>TalkNest</strong>! We're thrilled to have you join our community of users who value seamless, secure, and enjoyable communication. Whether you're connecting with friends, family, or colleagues, TalkNest is designed to make every conversation meaningful.
          </div>

          <div class="features-section">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">What you can do with TalkNest:</h2>

            <div class="feature-item">
              <span class="feature-icon">💬</span>
              <strong>Real-time Messaging:</strong> Send instant messages with friends and groups
            </div>

            <div class="feature-item">
              <span class="feature-icon">🔒</span>
              <strong>Secure & Private:</strong> End-to-end encryption keeps your conversations safe
            </div>

            <div class="feature-item">
              <span class="feature-icon">👥</span>
              <strong>Group Chats:</strong> Create and manage group conversations effortlessly
            </div>

            <div class="feature-item">
              <span class="feature-icon">📱</span>
              <strong>Cross-Platform:</strong> Access your messages from any device, anywhere
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="cta-button">
              Start Chatting Now
            </a>
          </div>

          <div class="tips-section">
            <div class="tips-title">🚀 Quick Start Tips:</div>
            <ul class="tips-list">
              <li>Complete your profile to help friends find you</li>
              <li>Add contacts by searching for their email or phone number</li>
              <li>Create groups for team projects or family discussions</li>
              <li>Customize your notification settings for a better experience</li>
            </ul>
          </div>

          <p>Need help getting started? Our support team is here for you. Feel free to reach out to us at <a href="mailto:${supportEmail}" style="color: #3498db;">${supportEmail}</a> if you have any questions.</p>

          <p>Thank you for choosing TalkNest. We can't wait to see the conversations you'll create!</p>

          <div class="footer">
            <div class="social-links">
              <a href="#">Facebook</a> |
              <a href="#">Twitter</a> |
              <a href="#">Instagram</a>
            </div>
            <p><strong>TalkNest Team</strong></p>
            <p>This is an automated welcome message. Please do not reply to this email.</p>
            <p>For support, contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
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

    console.log(`Welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};
