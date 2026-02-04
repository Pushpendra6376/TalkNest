import { transactionalEmailsApi } from '../config/brevo.config.js';

export const sendEmail = async (toEmail, subject, htmlContent) => {
  const sendSmtpEmail = {
    to: [{ email: toEmail }],
    sender: { name: "TalkNest Team", email: process.env.SENDER_EMAIL }, // .env me SENDER_EMAIL rakhein
    subject: subject,
    htmlContent: htmlContent,
  };

  try {
    await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error("Brevo Error:", error);
    throw new Error("Email sending failed");
  }
};

export const sendOtpEmail = async (email, otp) => {
  const html = `<h1>Your Verification Code</h1><p>Your OTP is: <b>${otp}</b></p><p>Valid for 10 minutes.</p>`;
  await sendEmail(email, "TalkNest Verification", html);
};

export const sendWelcomeEmail = async (email, name) => {
  const html = `<h1>Welcome ${name}!</h1><p>Congratulations, your account has been created successfully.</p>`;
  await sendEmail(email, "Welcome to TalkNest", html);
};