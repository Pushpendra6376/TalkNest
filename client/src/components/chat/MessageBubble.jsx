const MessageBubble = ({ message }) => {
  const isOwn = message.isOwn;
  const isText = message.type === "text";

  return (
    <div className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[70%]
          ${isText ? "px-3 py-2 rounded-lg" : ""}
        `}
        style={{
          backgroundColor: isText
            ? isOwn
              ? "rgba(20, 184, 166, 0.95)" // send text
              : "rgba(51, 65, 85, 0.95)"  // receive text
            : "transparent"
        }}
      >
        {/* TEXT MESSAGE */}
        {isText && (
          <p className="text-sm text-white leading-relaxed break-words">
            {message.text}
          </p>
        )}

        {/* IMAGE MESSAGE */}
        {message.type === "image" && (
          <a
            href={message.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={message.url}
              alt="chat-img"
              className="rounded-lg max-w-[240px] cursor-pointer hover:opacity-90"
            />
          </a>
        )}

        {/* PDF / DOC MESSAGE */}
        {message.type === "pdf" && (
          <a
            href={message.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              ${isOwn ? "bg-teal-600/90" : "bg-slate-700/90"}
              text-white text-sm hover:opacity-90
            `}
          >
            📄 {message.fileName}
          </a>
        )}

        {/* VIDEO MESSAGE */}
        {message.type === "video" && (
          <video
            src={message.url}
            controls
            className="rounded-lg max-w-[260px]"
          />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
