import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Smile, X, Paperclip } from 'lucide-react';
import EmojiPicker from './EmojiPicker.jsx';
import MediaComposer from './MediaComposer.jsx';
import twemoji from 'twemoji';

function ChatWindow({
  activeContact,
  error,
  loadingMessages,
  messages,
  user,
  draft,
  setDraft,
  handleSendMessage,
  sending,
  selectedMediaPreview,
  selectedMediaType,
  selectedMediaName,
  onMediaSelect,
  onRemoveMedia,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [openMedia, setOpenMedia] = useState(null);
  const emojiButtonRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !emojiPickerRef.current ||
        !emojiButtonRef.current ||
        !showEmojiPicker
      ) {
        return;
      }

      if (
        !emojiPickerRef.current.contains(event.target) &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const escapeHtml = (text) =>
    String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const isVideoUrl = (url) => /\.(mp4|mov|webm|ogg|m4v|avi|wmv|flv)$/i.test(url);
  const isAudioUrl = (url) => /\.(mp3|wav|ogg|m4a|flac)$/i.test(url);

  const addEmoji = (emoji) => {
    setDraft((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleOpenMedia = (url, type) => {
    setOpenMedia({ url, type });
  };

  const handleCloseMedia = () => {
    setOpenMedia(null);
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/20">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Chat with</p>
          <h2 className="text-xl font-semibold text-white">
            {activeContact ? activeContact.name : 'Select a contact'}
          </h2>
        </div>
        <MessageCircle className="h-6 w-6 text-cyan-400" />
      </div>

      {error && <p className="mb-4 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <div className="min-h-[420px] max-h-[55vh] flex flex-col space-y-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-200">
        {loadingMessages ? (
          <p className="text-slate-400">Loading messages...</p>
        ) : activeContact ? (
          messages.length === 0 ? (
            <p className="text-slate-400">No messages yet. Send the first message.</p>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-3">
              {messages.map((message) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                      isOwn
                        ? 'ml-auto rounded-br-none bg-cyan-500/20 text-cyan-100'
                        : 'mr-auto rounded-bl-none bg-slate-800 text-slate-100'
                    }`}
                  >
                    {message.image && (
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() => handleOpenMedia(message.image, 'photo')}
                          className="w-full"
                        >
                          <img
                            src={message.image}
                            alt="Attached"
                            className="max-h-64 w-full rounded-3xl object-contain"
                          />
                        </button>
                      </div>
                    )}

                    {message.video && (
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() => handleOpenMedia(message.video, 'video')}
                          className="w-full"
                        >
                          <video controls className="max-h-64 w-full rounded-3xl object-contain">
                            <source src={message.video} />
                            Your browser does not support the video tag.
                          </video>
                        </button>
                      </div>
                    )}

                    {message.document && (
                      <div className="mb-3">
                        <a
                          href={message.document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-cyan-200 hover:bg-slate-700"
                        >
                          <Paperclip className="h-4 w-4" />
                          Download document
                        </a>
                      </div>
                    )}
                    {message.text ? (
                      <p
                        dangerouslySetInnerHTML={{
                          __html: twemoji.parse(escapeHtml(message.text), {
                            folder: 'svg',
                            ext: '.svg',
                          }),
                        }}
                      />
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                      {isOwn && (
                        <span className="font-semibold">
                          {message.status === 'sent' && '✓'}
                          {message.status === 'delivered' && '✓✓'}
                          {message.status === 'seen' && (
                            <span className="text-cyan-400">✓✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <p className="text-slate-400">Choose a contact to start chatting.</p>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
        <MediaComposer
          selectedMediaPreview={selectedMediaPreview}
          selectedMediaType={selectedMediaType}
          selectedMediaName={selectedMediaName}
          onMediaSelect={onMediaSelect}
          onRemoveMedia={onRemoveMedia}
          onPreviewClick={() => handleOpenMedia(selectedMediaPreview, selectedMediaType)}
          disabled={!activeContact}
        />

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-800 p-2 text-slate-100 transition hover:bg-slate-700"
              aria-label="Choose emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={activeContact ? 'Write a message...' : 'Select a contact first'}
              disabled={!activeContact}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-12 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
            />
            {showEmojiPicker && (
              <div ref={emojiPickerRef}>
                <EmojiPicker onSelect={addEmoji} />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={(!draft.trim() && !selectedMediaPreview) || !activeContact || sending}
            className="inline-flex items-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="mr-2 h-4 w-4" /> Send
          </button>
        </div>
      </form>

      {openMedia && (
        <div
          onClick={handleCloseMedia}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleCloseMedia}
              className="absolute right-4 top-4 z-30 inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/90 p-2 text-slate-100 transition hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-4">
              {openMedia.type === 'video' ? (
                <video controls className="max-h-[80vh] w-full rounded-3xl object-contain">
                  <source src={openMedia.url} />
                  Your browser does not support the video tag.
                </video>
              ) : openMedia.type === 'audio' ? (
                <audio controls className="w-full">
                  <source src={openMedia.url} />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <img
                  src={openMedia.url}
                  alt="Full view"
                  className="max-h-[80vh] w-full rounded-3xl object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ChatWindow;
