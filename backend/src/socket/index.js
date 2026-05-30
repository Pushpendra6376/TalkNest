import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import registerHandlers from "./handlers.js";
import { CORS_ORIGIN, JWT_SECRET } from "../secrets.js";

let io;

// Tracks how many sockets each user currently has open.
// Map<userId: string, Set<socketId: string>>
// Used so we only mark a user offline when their LAST socket disconnects
// (handles multiple tabs / devices).
const userSocketMap = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });
  console.log("Socket.io initialized");

  // --- Authentication middleware ---
  // Every socket connection must present a valid JWT in handshake.auth.token.
  // On success we attach socket.userId so handlers never trust client-supplied IDs.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: no token provided"));
    }
    try {
      const data = jwt.verify(token, JWT_SECRET);
      socket.userId = data.user.id;
      next();
    } catch (err) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id} (user: ${socket.userId})`);

    // Track this socket in the per-user set.
    // IMPORTANT: always use String(socket.userId) as the key so it stays
    // consistent with the String(receiverId) lookups in handlers.js.
    // JavaScript Map uses strict equality — Map.get("1") !== Map.get(1)!
    const userIdKey = String(socket.userId);
    if (!userSocketMap.has(userIdKey)) {
      userSocketMap.set(userIdKey, new Set());
    }
    userSocketMap.get(userIdKey).add(socket.id);

    registerHandlers(io, socket, userSocketMap);

    socket.on("disconnect", () => {
      const sockets = userSocketMap.get(String(socket.userId));
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketMap.delete(String(socket.userId));
        }
      }
    });
  });

  return io;
};

export { initSocket }; 