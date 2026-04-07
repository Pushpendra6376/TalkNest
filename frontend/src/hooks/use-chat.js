import { useState, useContext, createContext } from "react";

export const useChatProvider = () => {
  const [receiver, setReceiver] = useState(null);
  const [messageList, setMessageList] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");

  const [typingConversations, setTypingConversations] = useState({});

  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  return {
    receiver,
    setReceiver,
    messageList,
    setMessageList,
    activeChatId,
    setActiveChatId,
    typingConversations,
    setTypingConversations,
    isOtherUserTyping,
    setIsOtherUserTyping,
    isChatLoading,
    setIsChatLoading,
  };
};

/* ─── context ───────────────────────────────────────── */

export const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
};