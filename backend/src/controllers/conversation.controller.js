import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { sequelize } from "../config/db.js";

/**
 * Helper: given a Conversation instance (with JSON members array of integer IDs),
 * fetch the corresponding User records (excluding sensitive fields).
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
 * Sanitizes a populated member document when viewed by someone whom that
 * member has blocked. Profile fields become generic placeholders; only the
 * id and email remain untouched (per product spec).
 * The `blockedUsers` and `pinnedConversations` arrays are always stripped.
 */
function sanitizeForRequester(member, requesterId) {
  const obj = member.toJSON ? member.toJSON() : { ...member };
  const isBlocked = (obj.blockedUsers || []).some(
    (id) => String(id) === String(requesterId)
  );
  delete obj.blockedUsers;
  delete obj.pinnedConversations;

  if (!isBlocked) return obj;

  return {
    id: obj.id,
    _id: obj.id,
    email: obj.email,
    name: "TalkNest User",
    about: "",
    profilePic:
      "https://ui-avatars.com/api/?name=TalkNest+User&background=6366f1&color=fff&bold=true",
    isOnline: false,
    lastSeen: null,
    isBot: obj.isBot,
    createdAt: null,
    updatedAt: null,
  };
}

const createConversation = async (req, res) => {
  try {
    const { members: memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }

    const sortedNew = [...memberIds].map(Number).sort((a, b) => a - b);

    // Check if a conversation already exists with exactly these members.
    // members is a JSON column so we fetch all and compare in JS.
    const allConvs = await Conversation.findAll();
    const existing = allConvs.find((c) => {
      const m = (c.members || []).map(Number).sort((a, b) => a - b);
      return (
        m.length === sortedNew.length &&
        sortedNew.every((id, i) => id === m[i])
      );
    });

    if (existing) {
      const members = await populateConvMembers(existing);
      const convObj = existing.toJSON();
      convObj.members = members
        .filter((m) => String(m.id) !== String(req.user.id))
        .map((m) => sanitizeForRequester(m, req.user.id));
      return res.status(200).json(convObj);
    }

    const newConversation = await Conversation.create({
      members: memberIds.map(Number),
      unreadCounts: memberIds.map((id) => ({ userId: Number(id), count: 0 })),
    });

    const members = await populateConvMembers(newConversation);
    const convObj = newConversation.toJSON();
    convObj.members = members
      .filter((m) => String(m.id) !== String(req.user.id))
      .map((m) => sanitizeForRequester(m, req.user.id));

    return res.status(200).json(convObj);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const getConversation = async (req, res) => {
  try {
    // Sequelize: findByPk replaces Mongoose findById
    const conversation = await Conversation.findByPk(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "No conversation found" });
    }

    // Ensure the requesting user is a member (members is a JSON array of IDs)
    const isMember = (conversation.members || []).some(
      (m) => String(m) === String(req.user.id)
    );
    if (!isMember) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const members = await populateConvMembers(conversation);
    const convObj = conversation.toJSON();
    convObj.members = members.map((m) =>
      sanitizeForRequester(m, req.user.id)
    );
    res.status(200).json(convObj);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const getConversationList = async (req, res) => {
  const userId = String(req.user.id);

  try {
    // Fetch pinned conversations list from the user record
    const currentUser = await User.findByPk(userId, {
      attributes: ["id", "pinnedConversations"],
    });
    const pinnedSet = new Set(
      (currentUser?.pinnedConversations || []).map(String)
    );

    // Use MySQL JSON_CONTAINS to efficiently find conversations the user belongs to.
    // JSON_CONTAINS(members, '5') checks if the JSON number 5 is in the array.
    const conversationList = await Conversation.findAll({
      where: sequelize.literal(
        `JSON_CONTAINS(members, '${parseInt(userId)}')`
      ),
      order: [["updatedAt", "DESC"]],
    });

    const result = [];
    for (const conv of conversationList) {
      const members = await populateConvMembers(conv);
      const convObj = conv.toJSON();
      // Strip the requester's own member record from the list
      convObj.members = members
        .filter((m) => String(m.id) !== userId)
        .map((m) => sanitizeForRequester(m, userId));
      convObj.isPinned = pinnedSet.has(String(conv.id));
      result.push(convObj);
    }

    // Sort: pinned conversations first, then by updatedAt (already sorted by DB)
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const togglePin = async (req, res) => {
  const userId = String(req.user.id);
  const convId = String(req.params.id);

  try {
    // Sequelize: findByPk replaces Mongoose findById
    const conversation = await Conversation.findByPk(convId);
    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    const isMember = (conversation.members || []).some(
      (m) => String(m) === userId
    );
    if (!isMember) return res.status(403).json({ error: "Forbidden" });

    // Fetch just the pinnedConversations JSON field
    const user = await User.findByPk(userId, {
      attributes: ["id", "pinnedConversations"],
    });
    const pinned = user.pinnedConversations || [];
    const isPinned = pinned.some((id) => String(id) === convId);

    if (isPinned) {
      // Unpin: filter out this conversation ID
      user.pinnedConversations = pinned.filter((id) => String(id) !== convId);
      await user.save();
      return res.status(200).json({ isPinned: false });
    } else {
      // Pin: add this conversation ID (addToSet equivalent)
      user.pinnedConversations = [...pinned, convId];
      await user.save();
      return res.status(200).json({ isPinned: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

export {
  createConversation,
  getConversation,
  getConversationList,
  togglePin,
};