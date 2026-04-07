/**
 * Centralized socket.io client.
 */

import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5500";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: { token: localStorage.getItem("auth-token") ?? "" },
});

/* ─── connection helpers ───────────────────────────────────────────────── */

/** Attach (or replace) the JWT and open the connection if not already open. */
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