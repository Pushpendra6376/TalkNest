import { ConversationsContext, useConversationsProvider } from "@/hooks/use-conversations";

export const ConversationsProvider = ({ children }) => {
  const value = useConversationsProvider();

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};