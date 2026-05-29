// dotenv must be configured FIRST before any other module reads process.env
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { connectDB, sequelize } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import { initSocket } from "./socket/index.js";
import { startStaleOnlineUsersJob } from "./Jobs/staleOnlineUsers.js";
import path from "path";

// models — must be imported so Sequelize registers them before sync()
import "./models/user.model.js";
import "./models/message.model.js";
import "./models/conversation.model.js";

const app = express();
const __dirname = path.resolve();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/user", userRoutes);
app.use("/api/conversations", conversationRoutes);

// Global error handler — must be registered after routes
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum allowed size is 50MB.' });
  }

  return res.status(500).json({ message: err.message || 'Server error' });
});

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

connectDB().then(async () => {
  await sequelize.sync(/*{ force: true }*/);
  initSocket(httpServer);

  // Start background job to reset stale online users
  // (handles edge case where disconnect event never fired, e.g. server crash)
  startStaleOnlineUsersJob();

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});