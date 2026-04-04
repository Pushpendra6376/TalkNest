import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 50],
    },
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
    set(value) {
      this.setDataValue("email", value.toLowerCase());
    },
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  about: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  profilePic: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    // Default is set to ui-avatars.com in the controller/service layer
  },

  isOnline: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  emailNotificationsEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

  isBot: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  otp: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  blockedUsers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    // Stores array of user IDs: [userId1, userId2, ...]
  },

  pinnedConversations: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    // Stores array of conversation IDs: [conversationId1, conversationId2, ...]
  },

  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },

  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

export default User;