import { useEffect } from "react";
import socket from "../lib/socket";

/**
 * Registers global typing / stop-typing socket listeners.
 * These update the `typingConversations` map used by ConversationsList
 * to show a typing indicator on the chat row.
 */
export const useSocketListeners = (setTypingConversations, userId) => {
  useEffect(() => {
    const onTyping = (data) => {
      // Ignore events that don't have a conversationId or are emitted by self
      if (!data?.conversationId || data?.typer === userId) return;

      setTypingConversations((prev) => ({
        ...prev,
        [data.conversationId]: data.typer, // store WHO is typing, not just true
      }));
    };

    const onStopTyping = (data) => {
      if (!data?.conversationId) return;

      // Fix #17: only remove the indicator if the person who stopped is the same
      // one who was typing. Without this check, if A & B both type in the same
      // conversation and A stops, B's indicator would disappear too.
      setTypingConversations((prev) => {
        // If the typer stored for this conversation is the one who stopped, clear it
        if (prev[data.conversationId] === data.typer) {
          const next = { ...prev };
          delete next[data.conversationId];
          return next;
        }
        return prev; // someone else was typing — don't clear
      });
    };

    socket.on("typing", onTyping);
    socket.on("stop-typing", onStopTyping);

    return () => {
      socket.off("typing", onTyping);
      socket.off("stop-typing", onStopTyping);
    };
  }, [userId, setTypingConversations]);
};