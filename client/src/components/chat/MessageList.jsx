import MessageBubble from "./MessageBubble";

const MessageList = () => {
  const messages = [
  { id: 1, text: "Hello bhai", type: "text", isOwn: true },
  { id: 2, text: "Haan bol", type: "text", isOwn: false },

  {
    id: 3,
    type: "image",
    url: "https://drive.google.com/uc?export=view&id=1rccHnp5P0EtI_jyFBhDN0OeaJLo55PKa",
    isOwn: true
  },

  {
    id: 4,
    type: "pdf",
    fileName: "invoice.pdf",
    url: "https://drive.google.com/uc?export=download&id=1kyTMzf7KPfQpEyLzgtVvjY6g-5tLwvJ_",
    isOwn: false
  }
];


  return (
    <div className="flex-1 px-4 py-2 overflow-y-auto">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
};

export default MessageList;
