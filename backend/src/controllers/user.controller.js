import crypto from "crypto";
import bcrypt from "bcryptjs";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { AWS_BUCKET_NAME, AWS_SECRET, AWS_ACCESS_KEY } from "../secrets.js";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET,
  },
  region: "ap-south-1",
});

const getPresignedUrl = async (req, res) => {

  const filename = req.query.filename;
  const filetype = req.query.filetype;

  if (!filename || !filetype) {
    return res
      .status(400)
      .json({ error: "Filename and filetype are required" });
  }

  if (!filetype.startsWith("image/")) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  const userId = req.user.id;

  try {
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: AWS_BUCKET_NAME,
      Key: `talknest/${userId}/${crypto.randomUUID()}-${filename}`,
      Conditions: [["content-length-range", 0, 5 * 1024 * 1024]],
      Fields: {
        success_action_status: "201",
      },
      Expires: 15 * 60,
    });

    return res.status(200).json({ url, fields });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getOnlineStatus = async (req, res) => {
  const userId = req.params.id;
  const requesterId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // If this user has blocked the requester, return offline (sanitized)
    const isBlocked = user.blockedUsers?.some(
      (id) => id.toString() === requesterId.toString()
    );
    res.status(200).json({ isOnline: isBlocked ? false : user.isOnline });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const blockUser = async (req, res) => {
  const targetId = String(req.params.id);
  const myId = String(req.user.id);
  if (targetId === myId) return res.status(400).json({ error: "Cannot block yourself" });
  try {
    const me = await User.findByPk(myId);
    if (!me) return res.status(404).json({ error: "User not found" });
    const current = me.blockedUsers || [];
    if (!current.some((id) => String(id) === targetId)) {
      me.blockedUsers = [...current, targetId];
      await me.save();
    }
    res.status(200).json({ message: "User blocked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const unblockUser = async (req, res) => {
  const targetId = String(req.params.id);
  const myId = String(req.user.id);
  try {
    const me = await User.findByPk(myId);
    if (!me) return res.status(404).json({ error: "User not found" });
    me.blockedUsers = (me.blockedUsers || []).filter((id) => String(id) !== targetId);
    await me.save();
    res.status(200).json({ message: "User unblocked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBlockStatus = async (req, res) => {
  const targetId = String(req.params.id);
  const myId = String(req.user.id);
  try {
    const [me, them] = await Promise.all([
      User.findByPk(myId, { attributes: ["id", "blockedUsers"] }),
      User.findByPk(targetId, { attributes: ["id", "blockedUsers"] }),
    ]);
    if (!them) return res.status(404).json({ error: "User not found" });
    const iBlockedThem = (me.blockedUsers || []).some(
      (id) => String(id) === targetId
    );
    const theyBlockedMe = (them.blockedUsers || []).some(
      (id) => String(id) === myId
    );
    res.status(200).json({ iBlockedThem, theyBlockedMe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const PINNED_EMAIL = "pmsoni2016@gmail.com";

const getNonFriendsList = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const sort = req.query.sort || "name_asc";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Find all conversations involving this user (members is JSON)
    const allConversations = await Conversation.findAll();
    const myConversations = allConversations.filter((c) => {
      const members = c.members || [];
      return members.some((m) => String(m) === String(req.user.id));
    });
    // IDs of users already in a conversation with this user
    const excludedIds = new Set();
    myConversations.forEach((c) => {
      (c.members || []).forEach((m) => excludedIds.add(String(m)));
    });
    // Always exclude self
    excludedIds.add(String(req.user.id));

    // Fetch all non-bot, non-deleted users and filter in JS
    // (Sequelize doesn't support JSON array containment queries portably)
    const { Op } = await import("sequelize");

    const whereClause = {
      isBot: false,
      isDeleted: false,
    };
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const sortMap = {
      name_asc: [["name", "ASC"]],
      name_desc: [["name", "DESC"]],
      last_seen_recent: [["lastSeen", "DESC"]],
      last_seen_oldest: [["lastSeen", "ASC"]],
    };
    const orderClause = sortMap[sort] || sortMap.name_asc;

    const allUsers = await User.findAll({
      where: whereClause,
      order: orderClause,
      attributes: { exclude: ["password", "otp", "otpExpiry"] },
    });

    // Filter out excluded IDs and bot emails in JS
    const filtered = allUsers.filter(
      (u) => !excludedIds.has(String(u.id)) && !u.email.endsWith("bot")
    );

    // Pinned user always at top of page 1
    let pinnedUser = null;
    if (!search) {
      const pinnedIdx = filtered.findIndex((u) => u.email === PINNED_EMAIL);
      if (pinnedIdx !== -1) {
        [pinnedUser] = filtered.splice(pinnedIdx, 1);
      }
    }

    const grandTotal = filtered.length + (pinnedUser ? 1 : 0);
    const paginated = filtered.slice(skip, skip + limit);
    const hasMore = skip + limit < grandTotal;

    res.json({
      users: paginated,
      pinnedUser: page === 1 ? pinnedUser : null,
      hasMore,
      total: grandTotal,
      page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateprofile = async (req, res) => {
  try {
    const dbuser = await User.findByPk(req.user.id);
    if (!dbuser) return res.status(404).json({ error: "User not found" });

    if (req.body.name !== undefined) dbuser.name = req.body.name;
    if (req.body.about !== undefined) dbuser.about = req.body.about;
    if (req.body.profilePic !== undefined) dbuser.profilePic = req.body.profilePic;
    if (req.body.emailNotificationsEnabled !== undefined)
      dbuser.emailNotificationsEnabled = req.body.emailNotificationsEnabled;

    if (req.body.newpassword) {
      const passwordCompare = await bcrypt.compare(
        req.body.oldpassword,
        dbuser.password
      );
      if (!passwordCompare) {
        return res.status(400).json({
          error: "Invalid Credentials",
        });
      }
      const salt = await bcrypt.genSalt(10);
      dbuser.password = await bcrypt.hash(req.body.newpassword, salt);
    }

    await dbuser.save();
    res.status(200).json({ message: "Profile Updated" });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const anonymisedEmail = `deleted-${crypto.randomUUID()}-${user.email}`;

    user.isDeleted = true;
    user.name = "Deleted TalkNest User";
    user.about = "";
    user.email = anonymisedEmail;
    user.profilePic = "https://ui-avatars.com/api/?name=Deleted+User&background=808080&color=ffffff&bold=true";
    user.password = "";
    user.otp = null;
    user.otpExpiry = null;
    user.lastSeen = null;
    await user.save();

    res.status(200).json({ message: "Account deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  getPresignedUrl,
  getOnlineStatus,
  getNonFriendsList,
  updateprofile,
  blockUser,
  unblockUser,
  getBlockStatus,
  deleteAccount,
};