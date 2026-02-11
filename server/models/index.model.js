import User from "./user.model.js";
import Message from "./message.model.js";

/**
 * Associations
 */

// User -> Messages (sent)
User.hasMany(Message, {
  foreignKey: "senderId",
  as: "sentMessages",
  onDelete: "CASCADE"
});

// User -> Messages (received)
User.hasMany(Message, {
  foreignKey: "receiverId",
  as: "receivedMessages",
  onDelete: "CASCADE"
});

// Message -> Sender
Message.belongsTo(User, {
  foreignKey: "senderId",
  as: "sender"
});

// Message -> Receiver
Message.belongsTo(User, {
  foreignKey: "receiverId",
  as: "receiver"
});
