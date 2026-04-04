import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Conversation = sequelize.define("Conversation", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  members: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      len: [2, 2],
    },
    // Stores array of exactly 2 user IDs: [userId1, userId2]
  },

  latestMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    // Preview text for chat list
  },

  unreadCounts: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    // Stores array of objects: [{ userId, count }, { userId, count }]
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

export default Conversation;
