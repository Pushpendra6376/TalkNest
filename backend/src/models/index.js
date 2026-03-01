import User from "./user.model.js";
import Group from "./groups.model.js";
import GroupMember from "./groupMembers.model.js";
import GroupMessage from "./groupMessages.model.js";
import Message from "./message.model.js";
/* Associations */

// Group Creator
User.hasMany(Group, { foreignKey: "createdBy", as: "createdGroups" });
Group.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// Many-to-Many
User.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: "userId",
  as: "groups",
});

Group.belongsToMany(User, {
  through: GroupMember,
  foreignKey: "groupId",
  as: "members",
});

// Group Messages
Group.hasMany(GroupMessage, {
  foreignKey: "groupId",
  as: "messages",
});

GroupMessage.belongsTo(Group, {
  foreignKey: "groupId",
});

User.hasMany(GroupMessage, {
  foreignKey: "senderId",
  as: "groupMessages",
});

GroupMessage.belongsTo(User, {
  foreignKey: "senderId",
  as: "sender",
});

// 1 on 1 conversation  message
// Sender relation
User.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });
Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });

// Receiver relation
User.hasMany(Message, { foreignKey: "receiverId", as: "receivedMessages" });
Message.belongsTo(User, { foreignKey: "receiverId", as: "receiver" });
