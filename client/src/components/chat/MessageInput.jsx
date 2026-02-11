const MessageInput = () => {
  return (
    <div style={{ padding: "10px", display: "flex" }}>
      <input
        type="text"
        placeholder="Type a message"
        style={{ flex: 1 }}
      />
      <button>Send</button>
    </div>
  );
};

export default MessageInput;
