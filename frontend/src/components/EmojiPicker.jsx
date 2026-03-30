import twemoji from 'twemoji';

const emojiList = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🫠','🤯','😵‍💫','🤑','🤠','🥳','😇','🥺','🤒','🤕','🫤','😤','😠','😡','🤬','😈','👿','💀','☠️','👻','👽','👾','🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
];

function EmojiPicker({ onSelect }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 grid w-[260px] max-h-72 grid-cols-6 gap-1 overflow-auto rounded-3xl border border-slate-700 bg-slate-900/95 p-2 shadow-xl shadow-slate-950/40">
      {emojiList.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 p-1 text-2xl transition hover:border-cyan-500"
          dangerouslySetInnerHTML={{
            __html: twemoji.parse(emoji, { folder: 'svg', ext: '.svg' }),
          }}
        />
      ))}
    </div>
  );
}

export default EmojiPicker;
