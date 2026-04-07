import { useAuth } from "@/hooks/use-auth";
import { ChatContext, useChatProvider } from "@/hooks/use-chat";
import { useSocketListeners } from "@/hooks/use-socket";

export const ChatProvider = ({ children }) => {
  const chat = useChatProvider();
  const { user } = useAuth();

  useSocketListeners(
    chat.setTypingConversations,
    user?._id
  );

  return (
    <ChatContext.Provider value={chat}>
      {children}
    </ChatContext.Provider>
  );
};