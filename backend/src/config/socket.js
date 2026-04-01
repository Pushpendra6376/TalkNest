import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

export let io = null;
const receiverSockets = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("login", async ({ token }) => {
      if (!token) {
        return socket.emit("loginError", "Token is required for socket login.");
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
          attributes: ["id"],
        });

        if (!user) {
          return socket.emit("loginError", "User not found.");
        }

        receiverSockets.set(String(user.id), socket.id);
        socket.userId = user.id;

        socket.emit("loginSuccess", { userId: user.id });
      } catch (error) {
        console.error("Socket login error:", error);
        socket.emit("loginError", "Invalid or expired token.");
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        receiverSockets.delete(String(socket.userId));
      }
      console.log("Socket disconnected:", socket.id);
    });

    socket.on("messageStatusUpdate", async ({ messageId, status }) => {
      try {
        if (!socket.userId) {
          return;
        }

        if (!messageId || !['delivered', 'seen'].includes(status)) {
          return;
        }

        const message = await Message.findByPk(messageId);
        if (!message || message.receiverId !== socket.userId) {
          return;
        }

        const rank = { sent: 1, delivered: 2, seen: 3 };
        if (rank[status] <= rank[message.status]) {
          return;
        }

        message.status = status;
        await message.save();

        const senderSocketId = getReceiverSocketId(message.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdated", {
            messageId: message.id,
            status,
          });
        }
      } catch (error) {
        console.error("Socket status update failed:", error);
      }
    });
  });
};

export const getReceiverSocketId = (userId) => {
  return receiverSockets.get(String(userId));
};
