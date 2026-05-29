/**
 * Centralized socket.io client.
 */

import { io } from "socket.io-client";
import { getBaseUrl } from "./utils";

const SOCKET_URL = getBaseUrl();

// Fix #10: Do NOT read the token at module-load time.
// At the time this module is first imported (before login / on page-refresh),
// localStorage may not yet have a valid token. The token is injected later
// via connectSocket(token) once we know the user is authenticated.
const socket = io(SOCKET_URL, {
  autoConnect: false,
  // auth is intentionally empty here; connectSocket sets it before connecting
  auth: {},
});

/* ─── connection helpers ───────────────────────────────────────────────── */

/**
 * Attach (or replace) the JWT and open the connection if not already open.
 * Always call this AFTER receiving a valid token (login / bootstrap).
 */
export const connectSocket = (token) => {
  socket.auth = { token };
  if (!socket.connected) socket.connect();
};

/** Close the connection gracefully (e.g. on logout). */
export const disconnectSocket = () => {
  socket.disconnect();
};

/* ─── emitters ─────────────────────────────────────────────────────────── */

export const emitSetup = () => {
  socket.emit("setup");
};

export const emitJoinChat = (roomId) => {
  socket.emit("join-chat", { roomId });
};

export const emitLeaveChat = (roomId) => {
  socket.emit("leave-chat", roomId);
};

export const emitSendMessage = ({
  conversationId,
  text,
  imageUrl,
  replyTo,
}) => {
  socket.emit("send-message", {
    conversationId,
    text,
    imageUrl,
    replyTo,
  });
};

export const emitDeleteMessage = ({
  messageId,
  conversationId,
  scope,
}) => {
  socket.emit("delete-message", {
    messageId,
    conversationId,
    scope,
  });
};

export const emitTyping = ({
  conversationId,
  typer,
  receiverId,
}) => {
  socket.emit("typing", {
    conversationId,
    typer,
    receiverId,
  });
};

export const emitStopTyping = ({
  conversationId,
  typer,
  receiverId,
}) => {
  socket.emit("stop-typing", {
    conversationId,
    typer,
    receiverId,
  });
};

/* ─── raw socket ───────────────────────────────────────────────────────── */
export default socket;