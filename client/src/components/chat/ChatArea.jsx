import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import NoChatSelected from "../common/NoChatSelected";
import { useState } from "react";

const ChatArea = ({ background }) => {
  const [isChatSelected, setIsChatSelected] = useState(false);

  return (
    <div className="relative w-[70%] h-full overflow-hidden">
      
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-contain transition-opacity duration-300"
        style={{
          backgroundImage: `url(${background})`,
          opacity: isChatSelected ? 0.5 : 0.2,
        }}
      />

      {/* Foreground Content */}
      <div className="relative z-10 h-full flex flex-col">
        {!isChatSelected ? (
          <NoChatSelected />
        ) : (
          <>
            <ChatHeader />
            <MessageList />
            <MessageInput />
          </>
        )}
      </div>

      {/* TEMP button (remove later, sidebar se set hoga) */}
      <button
        onClick={() => setIsChatSelected(true)}
        className="absolute bottom-4 right-4 z-20 bg-teal-500 text-white px-4 py-2 rounded"
      >
        Select Chat (Test)
      </button>
    </div>
  );
};

export default ChatArea;
