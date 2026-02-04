import User from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import { generateToken } from '../utils/token.util.js';
import { Op } from 'sequelize';

export const registerUser = async ({ name, email, phone, password }) => {
  // Check duplicates
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email: email || '' }, { phone: phone || '' }]
    }
  });

  if (existingUser) throw new Error("User already exists with this email or phone");

  const hashedPassword = await hashPassword(password);

  const newUser = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    isVerified: false // Requires OTP
  });

  return newUser;
};

export const loginUser = async (identifier, password) => {
  const user = await User.findOne({
    where: {
      [Op.or]: [{ email: identifier }, { phone: identifier }]
    }
  });

  if (!user) throw new Error("Invalid credentials");
  if (!user.password) throw new Error("Please login using Social Account"); // OAuth users might not have password

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  if (!user.isVerified) throw new Error("Account not verified. Please verify email.");

  const token = generateToken(user.id);
  return { user, token };
};