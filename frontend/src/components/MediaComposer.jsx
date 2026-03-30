import { useRef, useState } from 'react';
import { FileText, Image, Music, Paperclip, Video, X } from 'lucide-react';

const mediaOptions = [
  { key: 'photo', label: 'Photo', accept: 'image/*', Icon: Image },
  { key: 'video', label: 'Video', accept: 'video/*', Icon: Video },
  { key: 'audio', label: 'Audio', accept: 'audio/*', Icon: Music },
  {
    key: 'document',
    label: 'Document',
    accept: '.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx,.zip,.rar',
    Icon: FileText,
  },
];

function MediaComposer({
  selectedMediaPreview,
  selectedMediaType,
  selectedMediaName,
  onMediaSelect,
  onRemoveMedia,
  onPreviewClick,
  disabled,
}) {
  const [selectedOption, setSelectedOption] = useState('photo');
  const fileInputRef = useRef(null);

  const currentOption = mediaOptions.find((option) => option.key === selectedOption) || mediaOptions[0];

  const handleOptionClick = (type) => {
    setSelectedOption(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onMediaSelect(file, selectedOption);
    event.target.value = null;
  };

  const renderPreview = () => {
    if (!selectedMediaPreview) {
      return null;
    }

    if (selectedMediaType === 'video') {
      return (
        <video
          controls
          src={selectedMediaPreview}
          className="max-h-80 w-full rounded-3xl object-contain"
        />
      );
    }

    if (selectedMediaType === 'audio') {
      return <audio controls src={selectedMediaPreview} className="w-full" />;
    }

    if (selectedMediaType === 'photo') {
      return (
        <img
          src={selectedMediaPreview}
          alt="Preview"
          className="max-h-80 w-full rounded-3xl object-contain"
        />
      );
    }

    return (
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-950/90 p-4">
        <div>
          <p className="font-semibold text-white">{selectedMediaName}</p>
          <p className="text-sm text-slate-400">{selectedMediaType}</p>
        </div>
        <Paperclip className="h-6 w-6 text-cyan-400" />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {mediaOptions.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleOptionClick(key)}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
              selectedMediaType === key
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 bg-slate-950/80 text-slate-100 hover:border-cyan-500 hover:text-cyan-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={currentOption.accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {selectedMediaPreview && (
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-3">
            <button
              type="button"
              onClick={() => onPreviewClick?.()}
              className="w-full text-left"
            >
              {renderPreview()}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-100">Attached {selectedMediaType}</p>
              <p className="text-xs text-slate-400">{selectedMediaName}</p>
            </div>
            <button
              type="button"
              onClick={onRemoveMedia}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm text-slate-100 transition hover:border-rose-400 hover:text-rose-300"
            >
              <X className="h-4 w-4" /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaComposer;
