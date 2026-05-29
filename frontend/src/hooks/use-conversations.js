import { useState, useCallback, createContext, useContext } from "react";
import { conversationApi } from "../lib/api";

export const useConversationsProvider = () => {
  const [conversationsList, setConversationsList] = useState([]);
  // Fix #15: removed dead `originalChatList` state — it was set but never returned or used
  const [aiChatbotConversationId, setAIChatbotConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await conversationApi.list();

      setConversationsList(data);

      // Find the AI chatbot conversation (the one where a member has isBot = true)
      const chatbotConversation = data.find((c) =>
        c?.members?.some((m) => m?.isBot)
      );

      if (chatbotConversation) {
        setAIChatbotConversationId(chatbotConversation._id || null);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    conversationsList,
    setConversationsList,
    fetchConversations,
    isLoading,
    aiChatbotConversationId,
  };
};

/* ─── context ───────────────────────────────────────── */

export const ConversationsContext = createContext(null);

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (!context)
    // Fix #16: corrected error message — was "ChatProvider", should be "ConversationsProvider"
    throw new Error("useConversations must be used inside ConversationsProvider");
  return context;
};