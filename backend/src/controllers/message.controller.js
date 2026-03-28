import cloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../config/socket.js";
import { Op } from "sequelize";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const contacts = await User.findAll({
      where: {
        id: {
          [Op.ne]: loggedInUserId,
        },
      },
      attributes: ["id", "name", "email", "phone"],
    });

    return res.status(200).json(contacts);
  } catch (error) {
    console.error("Error in getAllContacts:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user.id;
    const userToChatId = Number(req.params.id);

    if (!Number.isInteger(userToChatId)) {
      return res.status(400).json({ message: "Invalid chat user ID." });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            senderId: myId,
            receiverId: userToChatId,
          },
          {
            senderId: userToChatId,
            receiverId: myId,
          },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessagesByUserId:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = Number(req.params.id);
    const { text, image } = req.body;

    if (!Number.isInteger(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID." });
    }

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }

    const receiver = await User.findByPk(receiverId, {
      attributes: ["id"],
    });
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl = null;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || null,
      image: imageUrl,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: loggedInUserId },
          { receiverId: loggedInUserId },
        ],
      },
      attributes: ["senderId", "receiverId"],
      raw: true,
    });

    const chatPartnerIds = Array.from(
      messages.reduce((ids, message) => {
        if (message.senderId !== loggedInUserId) ids.add(message.senderId);
        if (message.receiverId !== loggedInUserId) ids.add(message.receiverId);
        return ids;
      }, new Set())
    );

    if (!chatPartnerIds.length) {
      return res.status(200).json([]);
    }

    const chatPartners = await User.findAll({
      where: {
        id: {
          [Op.in]: chatPartnerIds,
        },
      },
      attributes: ["id", "name", "email", "phone"],
    });

    return res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
