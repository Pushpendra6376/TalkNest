import { useState, useCallback, createContext, useContext } from "react";
import { conversationApi } from "../lib/api";

export const useConversationsProvider = () => {
  const [conversationsList, setConversationsList] = useState([]);
  const [originalChatList, setOriginalChatList] = useState([]);
  const [aiChatbotConversationId, setAIChatbotConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await conversationApi.list();

      setConversationsList(data);
      setOriginalChatList(data);

      // find chatbot conversation
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
    originalChatList,
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
    throw new Error("useConversations must be used inside ChatProvider");
  return context;
};