import User from "./user.model.js";
import Group from "./groups.model.js";
import GroupMember from "./groupMembers.model.js";
import GroupMessage from "./groupMessages.model.js";
import Message from "./message.model.js";

/* ===================== ASSOCIATIONS ===================== */

// ===================== Group Creator =====================
User.hasMany(Group, {
  foreignKey: "createdBy",
  as: "createdGroups",
  onDelete: "CASCADE",
});

Group.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// ===================== Many-to-Many (User ↔ Group) =====================
User.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: "userId",
  as: "groups",
  onDelete: "CASCADE",
});

Group.belongsToMany(User, {
  through: GroupMember,
  foreignKey: "groupId",
  as: "members",
  onDelete: "CASCADE",
});

// 🔥 Explicit Junction Table Relations (VERY IMPORTANT)
Group.hasMany(GroupMember, {
  foreignKey: "groupId",
  onDelete: "CASCADE",
});

GroupMember.belongsTo(Group, {
  foreignKey: "groupId",
});

User.hasMany(GroupMember, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

GroupMember.belongsTo(User, {
  foreignKey: "userId",
});

// ===================== Group Messages =====================
Group.hasMany(GroupMessage, {
  foreignKey: "groupId",
  as: "messages",
  onDelete: "CASCADE",
});

GroupMessage.belongsTo(Group, {
  foreignKey: "groupId",
});

User.hasMany(GroupMessage, {
  foreignKey: "senderId",
  as: "groupMessages",
  onDelete: "CASCADE",
});

GroupMessage.belongsTo(User, {
  foreignKey: "senderId",
  as: "sender",
});

// ===================== 1-to-1 Messages =====================

// Sender
User.hasMany(Message, {
  foreignKey: "senderId",
  as: "sentMessages",
  onDelete: "CASCADE",
});

Message.belongsTo(User, {
  foreignKey: "senderId",
  as: "sender",
});

// Receiver
User.hasMany(Message, {
  foreignKey: "receiverId",
  as: "receivedMessages",
  onDelete: "CASCADE",
});

Message.belongsTo(User, {
  foreignKey: "receiverId",
  as: "receiver",
});