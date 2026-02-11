import Sidebar from "../components/sidebar/Sidebar";
import ChatArea from "../components/chat/ChatArea";
import bgImage from "../assets/TalkNest_chat_Background.png";

const ChatPage = () => {
  return (
    <div className="flex h-screen bg-[#0f172a]">
      <Sidebar />
      <ChatArea background={bgImage} />
    </div>
  );
};

export default ChatPage;
