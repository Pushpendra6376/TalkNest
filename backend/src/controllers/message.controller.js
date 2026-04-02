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
    const { text, image, video, document } = req.body;

    if (!Number.isInteger(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID." });
    }

    if (!text && !image && !video && !document) {
      return res.status(400).json({ message: "Text, image, video, or document is required." });
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
    let videoUrl = null;
    let documentUrl = null;

    const file = req.file;
    const mediaType = (req.body.mediaType || '').toLowerCase();

    if (file) {
      let resourceType = 'raw';
      if (mediaType === 'photo' || mediaType === 'image') resourceType = 'image';
      else if (mediaType === 'video') resourceType = 'video';
      else if (mediaType === 'audio') resourceType = 'video';
      else if (mediaType === 'document') resourceType = 'raw';
      else if (file.mimetype.startsWith('image/')) resourceType = 'image';
      else if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) resourceType = 'video';

      const uploadResponse = await cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder: `chat_media/${resourceType}s` },
        (error, result) => {
          if (error) {
            throw error;
          }
          return result;
        }
      );

      // Wait for stream upload by wrapping in promise
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: resourceType, folder: `chat_media/${resourceType}s` },
          (error2, result2) => {
            if (error2) {
              reject(error2);
            } else {
              resolve(result2);
            }
          }
        );
        uploadStream.end(file.buffer);
      });

      if (resourceType === 'image') imageUrl = uploadResult.secure_url;
      else if (resourceType === 'video') videoUrl = uploadResult.secure_url;
      else documentUrl = uploadResult.secure_url;
    }

    if (image && !imageUrl) {
      const uploaded = await cloudinary.uploader.upload(image, {
        resource_type: 'image',
        folder: 'chat_media/images',
      });
      imageUrl = uploaded.secure_url;
    }

    if (video && !videoUrl) {
      const uploaded = await cloudinary.uploader.upload(video, {
        resource_type: 'video',
        folder: 'chat_media/videos',
      });
      videoUrl = uploaded.secure_url;
    }

    if (document && !documentUrl) {
      const uploaded = await cloudinary.uploader.upload(document, {
        resource_type: 'raw',
        folder: 'chat_media/documents',
      });
      documentUrl = uploaded.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || null,
      image: imageUrl,
      video: videoUrl,
      document: documentUrl,
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
      attributes: ["id", "name", "email", "phone", "profilePic"],
    });

    return res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const myId = req.user.id;
    const chatPartnerId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(chatPartnerId)) {
      return res.status(400).json({ message: "Invalid chat partner ID." });
    }

    if (!['delivered', 'seen'].includes(status)) {
      return res.status(400).json({ message: "Invalid message status." });
    }

    if (chatPartnerId === myId) {
      return res.status(400).json({ message: "Cannot update status for yourself." });
    }

    const allowedStatuses = status === 'delivered' ? ['sent'] : ['sent', 'delivered'];

    const messagesToUpdate = await Message.findAll({
      where: {
        senderId: chatPartnerId,
        receiverId: myId,
        status: {
          [Op.in]: allowedStatuses,
        },
      },
      attributes: ['id'],
    });

    if (messagesToUpdate.length === 0) {
      return res.status(200).json({ updatedMessageIds: [] });
    }

    const messageIds = messagesToUpdate.map((message) => message.id);
    await Message.update(
      { status },
      {
        where: {
          id: messageIds,
        },
      }
    );

    const senderSocketId = getReceiverSocketId(chatPartnerId);
    if (senderSocketId) {
      messageIds.forEach((messageId) => {
        io.to(senderSocketId).emit('messageStatusUpdated', {
          messageId,
          status,
        });
      });
    }

    return res.status(200).json({ updatedMessageIds: messageIds });
  } catch (error) {
    console.error("Error in updateMessageStatus:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
