import { sendEmail } from "../config/brevoEmail.js";

export const sendAccountDeletionWarningEmail = async (userEmail, userName, confirmationToken) => {
  try {
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-deletion/${confirmationToken}`;

    const subject = "Account Deletion Warning - TalkNest";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deletion Warning</title>
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
          .warning-icon {
            font-size: 48px;
            color: #ff6b6b;
            margin-bottom: 20px;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 24px;
          }
          .warning-text {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .confirmation-button {
            display: inline-block;
            background-color: #ff6b6b;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          .confirmation-button:hover {
            background-color: #ff5252;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .cancel-text {
            color: #27ae60;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="warning-icon">⚠️</div>
            <h1>Account Deletion Warning</h1>
          </div>

          <p>Dear <strong>${userName}</strong>,</p>

          <div class="warning-text">
            <strong>Important:</strong> We received a request to delete your TalkNest account. This action cannot be undone and will permanently remove all your data, including messages, contacts, and account information.
          </div>

          <p>If you initiated this request and want to proceed with deleting your account, please click the button below to confirm:</p>

          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="confirmation-button">
              Confirm Account Deletion
            </a>
          </div>

          <p><strong>Please note:</strong> This confirmation link will expire in 24 hours for security reasons.</p>

          <p>If you did not request to delete your account, please ignore this email. Your account will remain active and secure.</p>

          <p>If you have any questions or need assistance, please contact our support team.</p>

          <div class="footer">
            <p>This is an automated message from TalkNest. Please do not reply to this email.</p>
            <p class="cancel-text">Didn't request this? No action needed - your account is safe.</p>
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

    console.log(`Account deletion warning email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending account deletion warning email:", error);
    throw new Error("Failed to send account deletion warning email");
  }
};
