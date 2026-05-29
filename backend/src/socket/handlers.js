import { Op } from "sequelize";
import { sequelize } from "../config/db.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import {
  streamAiResponse,
  sendMessageHandler,
  deleteMessageHandler,
} from "../controllers/message.controller.js";
import sendMessageEmail from "../utils/sendMessageEmail.js";

// userSocketMap is Map<userId, Set<socketId>> injected from socket/index.js.
// It is used to determine whether a user still has any open connections before
// marking them offline, so closing one browser tab doesn't falsely show them
// as offline while another tab is still connected.

/**
 * Helper: given a Conversation instance (with JSON members array of IDs),
 * fetch the corresponding User records.
 */
async function populateConvMembers(conv) {
  const memberIds = (conv.members || []).map(Number).filter(Boolean);
  if (memberIds.length === 0) return [];
  return User.findAll({
    where: { id: memberIds },
    attributes: { exclude: ["password", "otp", "otpExpiry"] },
  });
}

/**
 * Helper: find all conversations this user belongs to using JSON_CONTAINS.
 * Fix: replaces the full Conversation.findAll() + JS filter pattern used in
 * setup and disconnect handlers — avoids O(N) table scans on every connect/disconnect.
 */
async function getUserConversations(userId) {
  return Conversation.findAll({
    where: sequelize.literal(
      `JSON_CONTAINS(members, '${parseInt(userId)}')`
    ),
  });
}

const socketHandlers = (io, socket, userSocketMap) => {
  // socket.userId is set by the JWT auth middleware in socket/index.js.
  // We never trust a user-supplied ID for security-sensitive operations.
  const currentUserId = socket.userId;

  // ─── Setup ────────────────────────────────────────────────────────────────
  // Client calls this once after connecting to join their personal room and
  // announce they are online.
  socket.on("setup", async () => {
    try {
      socket.join(currentUserId);
      console.log("User joined personal room", currentUserId);
      socket.emit("user setup", currentUserId);

      await User.update({ isOnline: true }, { where: { id: currentUserId } });

      // Fix: use JSON_CONTAINS instead of loading all conversations into JS
      const conversations = await getUserConversations(currentUserId);

      // Collect unique friend IDs across all conversations
      const friendIds = new Set();
      conversations.forEach((conversation) => {
        (conversation.members || []).forEach((memberId) => {
          if (String(memberId) !== String(currentUserId)) {
            friendIds.add(String(memberId));
          }
        });
      });

      // Notify every online friend via their personal room
      friendIds.forEach((friendId) => {
        io.to(friendId).emit("user-online", { userId: currentUserId });
      });
    } catch (error) {
      console.error("Error in setup handler:", error);
    }
  });

  // ─── Join chat room ────────────────────────────────────────────────────────
  socket.on("join-chat", async (data) => {
    try {
      const { roomId } = data;
      console.log("User joined chat room", roomId);

      const conv = await Conversation.findByPk(roomId);
      if (!conv) return;

      // Verify the authenticated user is actually a member of this conversation
      const isMember = (conv.members || []).some(
        (m) => String(m) === String(currentUserId)
      );
      if (!isMember) {
        console.warn(
          `User ${currentUserId} tried to join conversation ${roomId} they are not a member of`
        );
        return;
      }

      socket.join(roomId);

      // Reset unread count for this user in the JSON unreadCounts array
      conv.unreadCounts = (conv.unreadCounts || []).map((unread) => {
        if (String(unread.userId) === String(currentUserId)) {
          return { ...unread, count: 0 };
        }
        return unread;
      });
      await conv.save();

      // Mark all unseen messages in this conversation as seen by this user.
      // Fix: instead of calling msg.save() in a loop (N+1 queries), collect
      // all messages that need updating and batch-update them in a transaction.
      const seenAt = new Date();

      const messages = await Message.findAll({
        where: {
          conversationId: roomId,
          // Sender's own messages don't need a seen receipt
          senderId: { [Op.ne]: currentUserId },
          // Don't update already soft-deleted messages
          softDeleted: false,
        },
      });

      // Collect IDs of messages that need their seenBy updated
      const msgsToUpdate = [];
      for (const msg of messages) {
        const hiddenFrom = msg.hiddenFrom || [];
        const seenBy = msg.seenBy || [];
        const isHidden = hiddenFrom.some(
          (id) => String(id) === String(currentUserId)
        );
        const alreadySeen = seenBy.some(
          (s) => String(s.user) === String(currentUserId)
        );

        if (!isHidden && !alreadySeen) {
          msgsToUpdate.push({ msg, newSeenBy: [...seenBy, { user: currentUserId, seenAt }] });
        }
      }

      // Batch update in a transaction
      if (msgsToUpdate.length > 0) {
        await sequelize.transaction(async (t) => {
          for (const { msg, newSeenBy } of msgsToUpdate) {
            await Message.update(
              { seenBy: newSeenBy },
              { where: { id: msg.id }, transaction: t }
            );
          }
        });
      }

      // Notify the sender(s) in this room that their messages were seen
      io.to(roomId).emit("messages-seen", {
        conversationId: roomId,
        seenBy: currentUserId,
        seenAt,
      });

      io.to(roomId).emit("user-joined-room", currentUserId);
    } catch (error) {
      console.error("Error in join-chat handler:", error);
    }
  });

  // ─── Leave chat room ───────────────────────────────────────────────────────
  socket.on("leave-chat", (room) => {
    socket.leave(room);
  });

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (data) => {
    try {
      console.log("Received message");

      const { conversationId, text, imageUrl, replyTo } = data;
      // Always use the authenticated user as the sender — never trust client-supplied senderId
      const senderId = currentUserId;

      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) return;

      // Fetch and populate conversation members for subsequent checks
      const members = await populateConvMembers(conversation);

      // Verify sender is a member of this conversation
      const isMember = members.some((m) => String(m.id) === String(senderId));
      if (!isMember) {
        console.warn(
          `User ${senderId} tried to send to conversation ${conversationId} they don't belong to`
        );
        return;
      }

      // ── AI bot processing ────────────────────────────────────────────────
      // Use the isBot field instead of an email-suffix heuristic.
      const botMember = members.find(
        (member) => String(member.id) !== String(senderId) && member.isBot
      );

      if (botMember) {
        const botId = String(botMember.id);
        const tempId = `bot-stream-${Date.now()}`;

        try {
          for await (const event of streamAiResponse(
            text,
            senderId,
            conversationId
          )) {
            if (event.type === "user-message") {
              // Emit real user message (has a proper DB id)
              io.to(conversationId).emit("receive-message", event.message);
              // Start the typing indicator
              io.to(conversationId).emit("typing", {
                typer: botId,
                conversationId,
              });
            } else if (event.type === "chunk") {
              io.to(conversationId).emit("bot-chunk", {
                conversationId,
                tempId,
                chunk: event.text,
              });
            } else if (event.type === "done") {
              io.to(conversationId).emit("stop-typing", {
                typer: botId,
                conversationId,
              });
              io.to(conversationId).emit("bot-done", {
                conversationId,
                tempId,
                message: event.message,
              });
            } else if (event.type === "error") {
              io.to(conversationId).emit("stop-typing", {
                typer: botId,
                conversationId,
              });
              io.to(conversationId).emit("bot-error", {
                conversationId,
                userMessageId: event.userMessageId ?? null,
              });
            }
          }
        } catch (err) {
          console.error("Bot streaming error:", err);
          io.to(conversationId).emit("stop-typing", {
            typer: botId,
            conversationId,
          });
          io.to(conversationId).emit("bot-error", {
            conversationId,
            userMessageId: null,
          });
        }
        return;
      }

      // ── Personal chat processing ─────────────────────────────────────────
      const receiverMember = members.find(
        (member) => String(member.id) !== String(senderId)
      );
      if (!receiverMember) return;

      const receiverId = receiverMember.id;

      // ── Block check ───────────────────────────────────────────────────────
      // Prevent sending if (a) the receiver has blocked the sender, or
      // (b) the sender has blocked the receiver.
      const [receiverDoc, senderDoc] = await Promise.all([
        User.findByPk(receiverId, {
          attributes: [
            "id",
            "blockedUsers",
            "emailNotificationsEnabled",
            "email",
            "name",
            "profilePic",
          ],
        }),
        User.findByPk(senderId, { attributes: ["id", "blockedUsers"] }),
      ]);

      const isBlockedByReceiver = (receiverDoc?.blockedUsers || []).some(
        (id) => String(id) === String(senderId)
      );
      const senderBlockedReceiver = (senderDoc?.blockedUsers || []).some(
        (id) => String(id) === String(receiverId)
      );

      if (isBlockedByReceiver || senderBlockedReceiver) {
        socket.emit("message-blocked", { conversationId });
        return;
      }

      // Determine if the receiver currently has the conversation room open.
      // Check ALL of the receiver's sockets so multi-device is handled correctly.
      const receiverSocketIds = userSocketMap.get(String(receiverId));
      let isReceiverInsideChatRoom = false;

      if (receiverSocketIds) {
        const conversationRoom = io.sockets.adapter.rooms.get(
          String(conversationId)
        );
        if (conversationRoom) {
          isReceiverInsideChatRoom = Array.from(receiverSocketIds).some(
            (sid) => conversationRoom.has(sid)
          );
        }
      }

      const message = await sendMessageHandler({
        text,
        imageUrl,
        senderId,
        conversationId,
        receiverId,
        isReceiverInsideChatRoom,
        replyTo: replyTo || null,
      });

      io.to(conversationId).emit("receive-message", message);

      if (!isReceiverInsideChatRoom) {
        console.log("Emitting new message notification to:", String(receiverId));
        const senderInfo = members.find(
          (m) => String(m.id) === String(senderId)
        );
        io.to(String(receiverId)).emit("new-message-notification", {
          message,
          sender: senderInfo,
          conversation: conversation.toJSON(),
        });

        // Fire-and-forget email notification — only when receiver is completely
        // offline (no open sockets) and has email notifications enabled.
        // Never awaited so it adds zero latency to message delivery.
        const isReceiverOffline =
          !receiverSocketIds || receiverSocketIds.size === 0;
        if (
          isReceiverOffline &&
          receiverDoc?.emailNotificationsEnabled &&
          receiverDoc?.email
        ) {
          sendMessageEmail(
            { name: receiverDoc.name, email: receiverDoc.email },
            { name: senderInfo?.name, profilePic: senderInfo?.profilePic },
            text || null,
            conversationId
          );
        }
      }
    } catch (error) {
      console.error("Error in send-message handler:", error);
    }
  };

  socket.on("send-message", handleSendMessage);

  // ─── Delete message ────────────────────────────────────────────────────────
  // scope="everyone": soft-delete → shows tombstone to all. Broadcast to room.
  // scope="me":       hard-delete for sender only → no broadcast (only caller hides it).
  const handleDeleteMessage = async (data) => {
    try {
      const { messageId, conversationId, scope } = data;
      const updated = await deleteMessageHandler({
        messageId,
        scope,
        requesterId: currentUserId,
      });
      if (!updated) return;

      if (scope === "everyone") {
        // Find the newest non-tombstone message to determine the new preview text.
        const latestNonDeleted = await Message.findOne({
          where: {
            conversationId,
            softDeleted: false,
          },
          order: [["createdAt", "DESC"]],
        });

        // If the tombstone is newer (or no other messages exist) → show tombstone text
        const newLatest =
          !latestNonDeleted ||
          new Date(updated.createdAt) >= new Date(latestNonDeleted.createdAt)
            ? "This message was deleted"
            : latestNonDeleted.text || "sent an image";

        // Persist new preview to the conversation document.
        const conv = await Conversation.findByPk(conversationId);
        if (conv) {
          conv.latestmessage = newLatest;
          await conv.save();
        }

        // Broadcast to every member so they see the tombstone + updated preview
        io.to(conversationId).emit("message-deleted", {
          messageId,
          conversationId,
          softDeleted: true,
          latestmessage: newLatest,
        });
      } else {
        // scope="me": find the newest message visible to this user only.
        // hiddenFrom is a JSON column — filter in JS after fetching all messages.
        const allMsgs = await Message.findAll({
          where: { conversationId },
          order: [["createdAt", "DESC"]],
        });

        const latestVisible = allMsgs.find(
          (m) =>
            !(m.hiddenFrom || []).some(
              (id) => String(id) === String(currentUserId)
            )
        );

        const newLatest = latestVisible
          ? latestVisible.softDeleted
            ? "This message was deleted"
            : latestVisible.text || "sent an image"
          : "";

        // Only emit to the requester so their sidebar preview updates
        socket.emit("message-deleted", {
          messageId,
          conversationId,
          softDeleted: false,
          latestmessage: newLatest,
        });
      }
    } catch (error) {
      console.error("Error in delete-message handler:", error);
    }
  };

  socket.on("delete-message", handleDeleteMessage);

  // ─── Typing indicators ─────────────────────────────────────────────────────
  // Helper: emit a typing event to everyone in the conversation room, and also
  // to the receiver's personal room if they are online but not currently viewing
  // this conversation (so they can show a subtle indicator in the chat list).
  const emitTypingEvent = (event, data) => {
    const { conversationId, receiverId } = data;

    // Always notify users already inside the room
    io.to(conversationId).emit(event, data);

    if (!receiverId) return;

    // Check if receiver is online
    const receiverSockets = userSocketMap.get(receiverId.toString());
    if (!receiverSockets || receiverSockets.size === 0) return; // offline

    // Check if ANY of their sockets are inside the conversation room
    const conversationRoom = io.sockets.adapter.rooms.get(conversationId);
    const isInsideRoom =
      conversationRoom &&
      Array.from(receiverSockets).some((sid) => conversationRoom.has(sid));

    if (!isInsideRoom) {
      // Online but not viewing this chat — emit to their personal room
      io.to(receiverId.toString()).emit(event, data);
    }
  };

  socket.on("typing", (data) => emitTypingEvent("typing", data));
  socket.on("stop-typing", (data) => emitTypingEvent("stop-typing", data));

  // ─── Disconnect ────────────────────────────────────────────────────────────
  // Only mark the user offline when ALL their sockets have disconnected
  // (i.e. they closed every tab/device), not just one of them.
  // NOTE: The userSocketMap cleanup (removing this socket.id) is handled by
  // socket/index.js AFTER this handler fires. That is why we check size <= 1
  // here — at this point the socket is still present in the set.
  socket.on("disconnect", async () => {
    console.log("Socket disconnected", socket.id, "user:", currentUserId);
    try {
      const sockets = userSocketMap.get(currentUserId);
      const isLastSocket = !sockets || sockets.size <= 1;

      if (!isLastSocket) {
        console.log(
          `User ${currentUserId} still has other sockets open — staying online`
        );
        return;
      }

      await User.update(
        { isOnline: false, lastSeen: new Date() },
        { where: { id: currentUserId } }
      );

      // Fix: use JSON_CONTAINS instead of loading all conversations into JS
      const conversations = await getUserConversations(currentUserId);

      // Collect unique friend IDs across all conversations
      const friendIds = new Set();
      conversations.forEach((conversation) => {
        (conversation.members || []).forEach((memberId) => {
          if (String(memberId) !== String(currentUserId)) {
            friendIds.add(String(memberId));
          }
        });
      });

      // Notify every online friend via their personal room
      friendIds.forEach((friendId) => {
        io.to(friendId).emit("user-offline", { userId: currentUserId });
      });
    } catch (error) {
      console.error("Error updating user status on disconnect:", error);
    }
  });
};

export default socketHandlers;