import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    senderId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    receiverId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    messageType: {
      type: DataTypes.ENUM("text", "image", "pdf", "video"),
      defaultValue: "text"
    }
  },
  {
    tableName: "messages",
    timestamps: true // 🕒 createdAt & updatedAt
  }
);

export default Message;
