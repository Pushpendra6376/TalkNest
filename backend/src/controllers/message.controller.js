import { GoogleGenAI } from "@google/genai";
import { Op } from "sequelize";
import { sequelize } from "../config/db.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { GEMINI_MODEL, GEMINI_API_KEY } from "../secrets.js";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const allMessage = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Verify the requesting user is a member (members is JSON array of IDs)
    const isMember = (conversation.members || []).some(
      (m) => String(m) === String(req.user.id)
    );
    if (!isMember) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userId = req.user.id;
    const seenAt = new Date();

    // Fetch all messages for this conversation, oldest first
    const allMsgs = await Message.findAll({
      where: { conversationId: req.params.id },
      order: [["createdAt", "ASC"]],
    });

    // Build a fast lookup map for replyTo messages
    const replyToIds = allMsgs.map((m) => m.replyTo).filter(Boolean);
    const replyToMap = {};
    if (replyToIds.length > 0) {
      const replyMsgs = await Message.findAll({
        where: { id: replyToIds },
        attributes: ["id", "text", "imageUrl", "senderId", "softDeleted"],
      });
      replyMsgs.forEach((m) => {
        replyToMap[m.id] = m.toJSON();
      });
    }

    const result = [];
    const toUpdate = []; // Messages that need to be marked as seen

    for (const msg of allMsgs) {
      const m = msg.toJSON();

      // Skip messages hidden from this user (hiddenFrom is a JSON array of IDs)
      if (
        (m.hiddenFrom || []).some((id) => String(id) === String(userId))
      ) {
        continue;
      }

      // Check if this user already appears in seenBy
      const alreadySeen = (m.seenBy || []).some(
        (s) => String(s.user) === String(userId)
      );

      if (!alreadySeen && String(m.senderId) !== String(userId)) {
        // Schedule this message for a seen-by update
        toUpdate.push(msg);
        // Reflect the update in the plain object we're about to return
        m.seenBy = [...(m.seenBy || []), { user: userId, seenAt }];
      }

      // Attach the full replyTo object (instead of just the ID)
      if (m.replyTo && replyToMap[m.replyTo]) {
        m.replyTo = replyToMap[m.replyTo];
      }

      // Sanitize soft-deleted messages: replace content with tombstone text
      // so the real content is never exposed in the network response.
      if (m.softDeleted) {
        m.text = "This message was deleted";
        delete m.imageUrl;
      }

      result.push(m);
    }

    // Persist seen-by updates for all newly seen messages in a single transaction
    // Fix: replaced loop with individual save() — now uses bulk update for performance
    if (toUpdate.length > 0) {
      for (const msg of toUpdate) {
        const current = msg.seenBy || [];
        if (!current.some((s) => String(s.user) === String(userId))) {
          msg.seenBy = [...current, { user: userId, seenAt }];
          await msg.save();
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * DELETE /api/message/:id
 * body: { scope: "me" | "everyone" }
 *
 * scope="everyone"  — soft-delete: sets softDeleted=true, visible to all as tombstone.
 *                     Only the original sender may do this.
 * scope="me"        — hard-delete for caller: adds caller to hiddenFrom so the
 *                     message (or tombstone) is skipped when queried for them.
 *                     Available for both own and received messages.
 */
const deleteMessage = async (req, res) => {
  const { scope } = req.body;
  if (!scope || !["me", "everyone"].includes(scope)) {
    return res
      .status(400)
      .json({ error: 'scope must be "me" or "everyone"' });
  }
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (scope === "everyone") {
      // Only the original sender can soft-delete for everyone
      if (String(message.senderId) !== String(req.user.id)) {
        return res
          .status(403)
          .json({ error: "Only the sender can delete for everyone" });
      }
      message.softDeleted = true;
    } else {
      // scope === "me": add requester to hiddenFrom JSON array
      const hiddenFrom = message.hiddenFrom || [];
      const alreadyHidden = hiddenFrom.some(
        (id) => String(id) === String(req.user.id)
      );
      if (!alreadyHidden) {
        message.hiddenFrom = [...hiddenFrom, req.user.id];
      }
    }

    await message.save();
    res.status(200).json(message);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * POST /api/message/clear/:conversationId
 * Adds the requesting user to hiddenFrom for every message in the conversation,
 * effectively clearing the entire chat history from their view.
 */
const clearChat = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(
      req.params.conversationId
    );
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    const isMember = (conversation.members || []).some(
      (m) => String(m) === String(req.user.id)
    );
    if (!isMember) return res.status(403).json({ error: "Forbidden" });

    const userId = String(req.user.id);

    // Fix: instead of looping and calling save() for each message (N+1 problem),
    // fetch all messages and use a raw bulk update approach.
    // We still need to read messages to update the JSON hiddenFrom field
    // (no SQL operator for JSON array append in MySQL), but we batch the writes
    // by collecting IDs that need updating and doing one UPDATE ... WHERE IN.
    const messages = await Message.findAll({
      where: { conversationId: req.params.conversationId },
    });

    const idsToUpdate = [];
    const updatedHiddenFrom = {};

    for (const msg of messages) {
      const hiddenFrom = msg.hiddenFrom || [];
      const alreadyHidden = hiddenFrom.some(
        (id) => String(id) === userId
      );
      if (!alreadyHidden) {
        idsToUpdate.push(msg.id);
        updatedHiddenFrom[msg.id] = JSON.stringify([...hiddenFrom, userId]);
      }
    }

    // Bulk update using a transaction for consistency
    if (idsToUpdate.length > 0) {
      await sequelize.transaction(async (t) => {
        for (const id of idsToUpdate) {
          await Message.update(
            { hiddenFrom: JSON.parse(updatedHiddenFrom[id]) },
            { where: { id }, transaction: t }
          );
        }
      });
    }

    res.status(200).json({ message: "Chat cleared" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Async generator that:
 * 1. Saves the user message to DB immediately → yields { type: "user-message", message }
 * 2. Streams the Gemini response chunk-by-chunk → yields { type: "chunk", text }
 * 3. Saves the completed bot message → yields { type: "done", message }
 * Yields { type: "error" } on failure so the caller can clean up.
 */
const streamAiResponse = async function* (text, senderId, conversationId) {
  const conv = await Conversation.findByPk(conversationId);
  if (!conv) {
    yield { type: "error" };
    return;
  }

  // Find the bot member: isBot=true and NOT the current user.
  // members is a JSON array of integer IDs.
  const memberIds = (conv.members || [])
    .map(Number)
    .filter((m) => m !== Number(senderId));

  // Fix: was passing array directly to id field — use Op.in for correct SQL
  const botMember = await User.findOne({
    where: { id: { [Op.in]: memberIds }, isBot: true },
  });
  if (!botMember) {
    yield { type: "error" };
    return;
  }
  const botId = botMember.id;

  // Save user message first so it gets a real id
  const userMessage = await Message.create({
    conversationId,
    senderId,
    text,
    seenBy: [{ user: botId, seenAt: new Date() }],
  });
  yield { type: "user-message", message: userMessage.toJSON() };

  // Build chat history for context (skip current message, image-only messages)
  const historyMessages = await Message.findAll({
    where: {
      conversationId,
      id: { [Op.ne]: userMessage.id },
      text: { [Op.ne]: null },
    },
    order: [["createdAt", "DESC"]],
    limit: 19,
  });

  const history = historyMessages.reverse().map((m) => ({
    role: String(m.senderId) === String(senderId) ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const chat = ai.chats.create({
    model: GEMINI_MODEL,
    history,
    config: { temperature: 0.5, maxOutputTokens: 1024 },
  });

  let fullText = "";
  try {
    const stream = await chat.sendMessageStream({ message: text });
    for await (const chunk of stream) {
      const chunkText = chunk.text || "";
      if (chunkText) {
        fullText += chunkText;
        yield { type: "chunk", text: chunkText };
      }
    }
  } catch (err) {
    console.error("Gemini stream error:", err.message);
    // Roll back the user message so the conversation stays consistent
    await Message.destroy({ where: { id: userMessage.id } });
    yield { type: "error", userMessageId: userMessage.id };
    return;
  }

  if (!fullText) {
    await Message.destroy({ where: { id: userMessage.id } });
    yield { type: "error", userMessageId: userMessage.id };
    return;
  }

  const botMessage = await Message.create({
    conversationId,
    senderId: botId,
    text: fullText,
  });

  // Update conversation preview
  conv.latestmessage = fullText;
  await conv.save();

  yield { type: "done", message: botMessage.toJSON() };
};

const sendMessageHandler = async (data) => {
  const {
    text,
    imageUrl,
    senderId,
    conversationId,
    receiverId,
    isReceiverInsideChatRoom,
    replyTo,
  } = data;

  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) return null;

  const seenBy = isReceiverInsideChatRoom
    ? [{ user: receiverId, seenAt: new Date() }]
    : [];

  const message = await Message.create({
    conversationId,
    senderId,
    text,
    imageUrl,
    seenBy,
    ...(replyTo && { replyTo }),
  });

  // Update conversation: latest message preview + unread count for receiver
  conversation.latestmessage = text || "sent an image";
  if (!isReceiverInsideChatRoom) {
    // Upsert receiver's unread count: increment if entry exists, add with count=1 if missing.
    // The old .map() approach silently did nothing when unreadCounts was an empty array [].
    const currentCounts = conversation.unreadCounts || [];
    const existingIdx = currentCounts.findIndex(
      (u) => String(u.userId) === String(receiverId)
    );
    if (existingIdx !== -1) {
      conversation.unreadCounts = currentCounts.map((u, i) =>
        i === existingIdx ? { ...u, count: (u.count || 0) + 1 } : u
      );
    } else {
      conversation.unreadCounts = [
        ...currentCounts,
        { userId: receiverId, count: 1 },
      ];
    }
  }
  await conversation.save();

  // Manually populate replyTo (Mongoose populate replacement)
  const result = message.toJSON();
  if (result.replyTo) {
    const replyMsg = await Message.findByPk(result.replyTo, {
      attributes: ["id", "text", "imageUrl", "senderId", "softDeleted"],
    });
    result.replyTo = replyMsg ? replyMsg.toJSON() : null;
  }

  return result;
};

/**
 * Used by the socket handler for real-time delete.
 * scope="everyone" → soft-delete (sets softDeleted=true), only sender allowed.
 * scope="me"       → adds requesterId to hiddenFrom.
 * Returns the updated message plain object or false on failure.
 */
const deleteMessageHandler = async ({ messageId, scope, requesterId }) => {
  try {
    const message = await Message.findByPk(messageId);
    if (!message) return false;

    if (scope === "everyone") {
      if (String(message.senderId) !== String(requesterId)) return false;
      message.softDeleted = true;
    } else {
      // scope === "me": add to hiddenFrom JSON array
      const hiddenFrom = message.hiddenFrom || [];
      const alreadyHidden = hiddenFrom.some(
        (id) => String(id) === String(requesterId)
      );
      if (!alreadyHidden) {
        message.hiddenFrom = [...hiddenFrom, requesterId];
      }
    }

    await message.save();
    return message.toJSON();
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

/**
 * DELETE /api/message/bulk/hide
 * body: { messageIds: number[] }
 * Adds the requesting user to hiddenFrom for every listed message (hard-delete for self).
 */
const bulkHide = async (req, res) => {
  const { messageIds } = req.body;
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res
      .status(400)
      .json({ error: "messageIds must be a non-empty array" });
  }
  try {
    const messages = await Message.findAll({
      where: { id: { [Op.in]: messageIds } },
    });

    const userId = req.user.id;
    for (const msg of messages) {
      const hiddenFrom = msg.hiddenFrom || [];
      if (!hiddenFrom.some((id) => String(id) === String(userId))) {
        msg.hiddenFrom = [...hiddenFrom, userId];
        await msg.save();
      }
    }

    res.status(200).json({ message: "Messages hidden" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * POST /api/message/:id/star
 * Toggle star for the requesting user on a single message.
 * Returns { isStarred: boolean, starredBy: [] }.
 */
const toggleStar = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Ensure the requester is a member of the conversation
    const conversation = await Conversation.findByPk(message.conversationId);
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });
    const isMember = (conversation.members || []).some(
      (m) => String(m) === String(req.user.id)
    );
    if (!isMember) return res.status(403).json({ error: "Forbidden" });

    const starredBy = message.starredBy || [];
    const userId = req.user.id;
    const alreadyStarred = starredBy.some(
      (id) => String(id) === String(userId)
    );

    if (alreadyStarred) {
      // Unstar: filter out this user ID
      message.starredBy = starredBy.filter(
        (id) => String(id) !== String(userId)
      );
    } else {
      // Star: add this user ID
      message.starredBy = [...starredBy, userId];
    }

    await message.save();
    res
      .status(200)
      .json({ isStarred: !alreadyStarred, starredBy: message.starredBy });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * GET /api/message/starred
 * Returns all messages starred by the requesting user, newest first.
 * Each message includes a populated conversationId so the client knows
 * which chat to navigate to.
 */
const getStarredMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all non-soft-deleted messages, then filter in JS for JSON fields.
    // (Can't do JSON array membership checks portably in MySQL WHERE clause)
    const allMsgs = await Message.findAll({
      where: { softDeleted: false },
      order: [["createdAt", "DESC"]],
    });

    // Keep only: starred by this user AND not hidden from this user
    const starred = allMsgs.filter((m) => {
      const isStarred = (m.starredBy || []).some(
        (id) => String(id) === String(userId)
      );
      const isHidden = (m.hiddenFrom || []).some(
        (id) => String(id) === String(userId)
      );
      return isStarred && !isHidden;
    });

    // Collect all unique conversationIds to batch-fetch conversations and members
    const convIds = [...new Set(starred.map((m) => m.conversationId))];

    // Batch fetch all needed conversations and their members in parallel
    const [convList, allMembers] = await Promise.all([
      Conversation.findAll({ where: { id: { [Op.in]: convIds } } }),
      (async () => {
        // Collect all member IDs across all relevant conversations
        const convs = await Conversation.findAll({
          where: { id: { [Op.in]: convIds } },
        });
        const memberIds = [
          ...new Set(convs.flatMap((c) => (c.members || []).map(Number))),
        ];
        return User.findAll({
          where: { id: { [Op.in]: memberIds } },
          attributes: { exclude: ["password", "otp", "otpExpiry"] },
        });
      })(),
    ]);

    // Build lookup maps
    const convMap = {};
    convList.forEach((c) => (convMap[c.id] = c.toJSON()));
    const memberMap = {};
    allMembers.forEach((u) => (memberMap[u.id] = u.toJSON()));

    // Assemble result — no additional DB queries needed
    const result = starred.map((msg) => {
      const m = msg.toJSON();
      const conv = convMap[m.conversationId];
      if (!conv) return null;
      m.conversationId = {
        ...conv,
        members: (conv.members || []).map((id) => memberMap[id]).filter(Boolean),
      };
      return m;
    }).filter(Boolean);

    res.json(result);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  allMessage,
  streamAiResponse,
  deleteMessage,
  bulkHide,
  clearChat,
  sendMessageHandler,
  deleteMessageHandler,
  toggleStar,
  getStarredMessages,
};