import Otp from '../models/otp.model.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

export const generateOtp = async (identifier, type) => {
  // Delete old OTPs
  await Otp.destroy({ where: { identifier, type } });

  const otpValue = Math.floor(100000 + Math.random() * 900000).toString(); // 6 Digit
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

  await Otp.create({
    identifier,
    otp: otpValue,
    type,
    expiresAt
  });

  return otpValue;
};

export const verifyOtp = async (identifier, otpValue, type) => {
  const record = await Otp.findOne({
    where: {
      identifier,
      otp: otpValue,
      type,
      expiresAt: { [Op.gt]: new Date() } // Not expired
    }
  });

  if (!record) return false;
  
  // OTP used, delete it
  await record.destroy();
  return true;
};