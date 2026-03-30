import { Op, fn, col, where } from "sequelize";
import cloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";

export const searchUsers = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    const searchPattern = `%${query.toLowerCase()}%`;
    const users = await User.findAll({
      where: {
        [Op.or]: [
          where(fn("lower", col("name")), { [Op.like]: searchPattern }),
          where(fn("lower", col("email")), { [Op.like]: searchPattern }),
          where(fn("lower", col("phone")), { [Op.like]: searchPattern }),
        ],
      },
      attributes: ["id", "name", "email", "phone", "profilePic", "bio"],
      limit: 20,
    });

    if (!users.length) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "phone", "profilePic", "bio"],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in getUserById:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, profilePic, bio } = req.body;

    const updateData = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: "Name cannot be empty." });
      }
      if (trimmedName.length < 2) {
        return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
      }
      updateData.name = trimmedName;
    }

    if (email !== undefined) {
      const trimmedEmail = String(email).trim().toLowerCase();
      if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }
      updateData.email = trimmedEmail;
    }

    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (!trimmedPhone || trimmedPhone.length < 10) {
        return res.status(400).json({ success: false, message: "Phone number must be at least 10 digits." });
      }
      updateData.phone = trimmedPhone;
    }

    if (bio !== undefined) {
      const trimmedBio = String(bio).trim();
      if (trimmedBio.length > 1000) {
        return res.status(400).json({ success: false, message: "Bio must be under 1000 characters." });
      }
      updateData.bio = trimmedBio;
    }

    if (profilePic !== undefined) {
      if (!profilePic) {
        return res.status(400).json({ success: false, message: "Profile picture data is required." });
      }
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ success: false, message: "No profile fields provided to update." });
    }

    if (updateData.email || updateData.phone) {
      const conflictConditions = [];
      if (updateData.email) conflictConditions.push({ email: updateData.email });
      if (updateData.phone) conflictConditions.push({ phone: updateData.phone });

      const existingUser = await User.findOne({
        where: {
          [Op.or]: conflictConditions,
          id: {
            [Op.ne]: userId,
          },
        },
      });

      if (existingUser) {
        const conflictField = existingUser.email === updateData.email ? "Email" : "Phone";
        return res.status(409).json({ success: false, message: `${conflictField} is already in use by another account.` });
      }
    }

    await User.update(updateData, { where: { id: userId } });

    const updatedUser = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "phone", "profilePic", "bio"],
    });

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
