import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowRight, ImagePlus, ShieldX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

import { emitSendMessage, emitTyping, emitStopTyping } from "@/lib/socket";
import { userApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STOP_TYPING_DELAY = 1500;

export default function MessageInput({
  conversationId,
  myId,
  receiverId,
  receiverName,
  isReceiverBot,
  isBlocked,
  blockedByThem,
  replyToMessage,
  onCancelReply,
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");

  const fileInputRef = useRef(null);
  const stopTypingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef(null);

  const emitStopTypingNow = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitStopTyping({ conversationId, typer: myId, receiverId });
    }
  }, [conversationId, myId, receiverId]);

  useEffect(() => {
    return () => {
      if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
      emitStopTypingNow();
    };
  }, [emitStopTypingNow]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId]);

  useEffect(() => {
    if (replyToMessage) textareaRef.current?.focus();
  }, [replyToMessage]);

  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping({ conversationId, typer: myId, receiverId });
    }

    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(
      emitStopTypingNow,
      STOP_TYPING_DELAY
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    emitStopTypingNow();

    emitSendMessage({
      conversationId,
      text: trimmed,
      replyTo: replyToMessage?._id ?? null,
    });

    setText("");
    onCancelReply?.();
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB allowed");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageDialogOpen(true);
    e.target.value = "";
  };

  const handleSendImage = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const { url, fields } = await userApi.getPresignedUrl(
        selectedFile.name,
        selectedFile.type
      );

      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) =>
        formData.append(k, v)
      );
      formData.append("file", selectedFile);

      const res = await fetch(url, { method: "POST", body: formData });
      if (!res.ok && res.status !== 201) throw new Error("Upload failed");

      const imageUrl = `${url}${fields.key}`;

      emitSendMessage({
        conversationId,
        imageUrl,
        ...(caption.trim() && { text: caption.trim() }),
        replyTo: replyToMessage?._id ?? null,
      });

      onCancelReply?.();
      closeImageDialog();
    } catch (err) {
      toast.error("Image send failed");
    } finally {
      setUploading(false);
    }
  };

  const closeImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedFile(null);
    setCaption("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <>
      {(isBlocked || blockedByThem) ? (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t text-sm text-muted-foreground">
          <ShieldX className="size-4" />
          <span>
            {isBlocked
              ? "You blocked this user"
              : "You can't send messages"}
          </span>
        </div>
      ) : (
        <div className="border-t bg-background">

          {/* Reply */}
          {replyToMessage && (
            <div className="flex items-center gap-3 px-4 pt-2">
              <div className="flex-1 border-l-2 border-primary pl-2">
                <p className="text-xs text-primary">
                  Replying to{" "}
                  {replyToMessage.senderId === myId
                    ? "yourself"
                    : receiverName || "them"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {replyToMessage.text || "Photo"}
                </p>
              </div>
              <button onClick={onCancelReply}>
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 p-3">
            {!isReceiverBot && (
              <>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                />
              </>
            )}

            <Textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1"
            />

            <Button onClick={handleSendText} disabled={!text.trim()}>
              <ArrowRight />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={(o) => !o && closeImageDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send image</DialogTitle>
          </DialogHeader>

          {previewUrl && <img src={previewUrl} alt="preview" />}

          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption"
          />

          <DialogFooter>
            <Button onClick={closeImageDialog}>Cancel</Button>
            <Button onClick={handleSendImage} disabled={uploading}>
              {uploading ? <Spinner /> : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}