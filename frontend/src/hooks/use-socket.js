import { useEffect } from "react";
import socket from "../lib/socket";

export const useSocketListeners = (setTypingConversations, userId) => {
  useEffect(() => {
    const onTyping = (data) => {
      if (!data?.conversationId || data?.typer === userId) return;

      setTypingConversations((prev) => ({
        ...prev,
        [data.conversationId]: true,
      }));
    };

    const onStopTyping = (data) => {
      if (!data?.conversationId) return;

      setTypingConversations((prev) => {
        const next = { ...prev };
        delete next[data.conversationId];
        return next;
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