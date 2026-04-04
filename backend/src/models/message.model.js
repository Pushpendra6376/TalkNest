import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import User from "./user.model.js";
import Conversation from "./conversation.model.js";

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Conversation,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    text: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        // Either text or imageUrl must be present
      },
    },

    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      // S3 URL; either text or imageUrl must be present
    },

    seenBy: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      // Stores array of objects: [{ userId, seenAt }, { userId, seenAt }]
    },

    hiddenFrom: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      // Stores array of user IDs: [userId1, userId2, ...]
      // Hard-deleted for these users
    },

    softDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      // true = "deleted" tombstone shown to all
    },

    starredBy: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      // Stores array of user IDs: [userId1, userId2, ...]
    },

    replyTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // Quoted reply reference; no strict self-referential foreign key here.
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
  },
  {
    timestamps: true,
  }
);

export default Message;