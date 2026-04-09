import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, Trash2, Check, CheckCheck, CheckCircle2, Circle, Star, Reply } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { useNavigate } from "react-router-dom"

/* ─── helpers ───────────────────────────────────────── */
function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })
}

/* ─── component ─────────────────────────────────────── */
export default function SingleMessage({
    message,
    isMine,
    isBot,
    receiverId,
    myId,
    receiverName,
    onDelete,
    onStar,
    onReply,
    selectMode,
    selected,
    onToggleSelect,
    highlighted,
}) {
    const [hovered, setHovered] = useState(false)
    const [copied, setCopied] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const navigate = useNavigate()

    const isStarred = message.starredBy?.includes(myId)

    const handleCopy = () => {
        if (message.text) {
            navigator.clipboard.writeText(message.text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        }
    }

    const handleRowClick = () => {
        if (selectMode && onToggleSelect) {
            onToggleSelect(message._id)
        }
    }

    return (
        <>
            <div
                data-message-id={message._id}
                className={cn(
                    "group flex items-end gap-2",
                    isMine
                        ? "ml-auto flex-row-reverse max-w-[75%]"
                        : isBot
                        ? "mr-auto max-w-[85%]"
                        : "mr-auto max-w-[75%]",
                    selectMode && "cursor-pointer",
                    selectMode && selected && (isMine ? "pr-2" : "pl-2")
                )}
                onMouseEnter={() => { if (!selectMode) setHovered(true) }}
                onMouseLeave={() => { if (!selectMode) setHovered(false) }}
                onClick={handleRowClick}
            >
                {/* Select Checkbox */}
                {selectMode && (
                    <div className="flex items-center shrink-0">
                        {selected
                            ? <CheckCircle2 className="size-5 text-primary" />
                            : <Circle className="size-5 text-muted-foreground" />}
                    </div>
                )}

                {/* Bubble */}
                <div
                    className={cn(
                        "relative px-3.5 py-2 text-sm shadow-sm transition-shadow",
                        isMine
                            ? "bg-primary text-white rounded-2xl rounded-br-sm"
                            : "bg-muted text-foreground rounded-2xl rounded-bl-sm",
                        highlighted && "animate-highlight"
                    )}
                >
                    {/* Reply preview */}
                    {message.replyTo && !message.softDeleted && (
                        <div
                            onClick={() =>
                                navigate(`/user/conversations/${message.conversationId}?highlight=${message.replyTo?._id}`)
                            }
                            className={cn(
                                "my-2 px-2 py-1 rounded border-l-2 text-xs space-y-0.5 max-w-full cursor-pointer",
                                isMine
                                    ? "border-white/50 bg-white/10"
                                    : "border-primary/50 bg-primary/5"
                            )}
                        >
                            <p className={cn("font-semibold truncate", isMine ? "text-white/80" : "text-primary")}>
                                {message.replyTo.senderId === myId ? "You" : receiverName}
                            </p>
                            <p className={cn("truncate", isMine ? "text-white/60" : "text-muted-foreground")}>
                                {message.replyTo.softDeleted
                                    ? "This message was deleted"
                                    : message.replyTo.text || "🖼️ Photo"}
                            </p>
                        </div>
                    )}

                    {/* Deleted message */}
                    {message.softDeleted ? (
                        <p className="text-xs italic opacity-60 select-none">
                            This message was deleted
                        </p>
                    ) : (
                        <>
                            {/* Image */}
                            {message.imageUrl && (
                                <img
                                    src={message.imageUrl}
                                    alt="attachment"
                                    className="max-w-60 max-h-80 rounded-lg mb-1 object-cover"
                                />
                            )}

                            {/* Text */}
                            {message.text && (
                                isBot && !isMine ? (
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.text}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap break-all">
                                        {message.text}
                                    </p>
                                )
                            )}
                        </>
                    )}

                    {/* Time + tick */}
                    <span
                        className={cn(
                            "flex items-center justify-end gap-1 text-[10px] mt-0.5",
                            isMine ? "text-white/60" : "text-muted-foreground"
                        )}
                    >
                        {formatTime(message.createdAt)}

                        {isMine && (() => {
                            const seen = message.seenBy?.some((s) => s.user === receiverId)
                            return seen
                                ? <CheckCheck className="size-3 text-sky-300" />
                                : <Check className="size-3" />
                        })()}
                    </span>
                </div>

                {/* Actions */}
                {!selectMode && (
                    <div
                        className={cn(
                            "flex items-center gap-1 transition-opacity",
                            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                    >
                        {!message.softDeleted && (
                            <>
                                {/* Reply */}
                                <Button size="icon" variant="secondary" onClick={() => onReply(message)}>
                                    <Reply className="size-3.5" />
                                </Button>

                                {/* Star */}
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={() => onStar(message._id)}
                                    className={cn(isStarred && "text-yellow-400")}
                                >
                                    <Star className={cn("size-3.5", isStarred && "fill-yellow-400")} />
                                </Button>
                            </>
                        )}

                        {/* Copy */}
                        {message.text && !message.softDeleted && (
                            <Button size="icon" variant="secondary" onClick={handleCopy}>
                                {copied
                                    ? <Check className="size-3.5 text-green-500" />
                                    : <Copy className="size-3.5" />}
                            </Button>
                        )}

                        {/* Delete */}
                        {(!message.softDeleted || isMine) && (
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete message</AlertDialogTitle>
                        <AlertDialogDescription>
                            {message.softDeleted
                                ? "Remove from your view?"
                                : "Choose how you want to delete this message."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter className="flex-col gap-2">
                        {isMine && !message.softDeleted && (
                            <AlertDialogAction
                                className="w-full"
                                onClick={() => {
                                    setDeleteOpen(false)
                                    onDelete(message._id, "everyone")
                                }}
                            >
                                Delete for everyone
                            </AlertDialogAction>
                        )}

                        <AlertDialogAction
                            className="w-full"
                            onClick={() => {
                                setDeleteOpen(false)
                                onDelete(message._id, "me")
                            }}
                        >
                            Delete for me
                        </AlertDialogAction>

                        <AlertDialogCancel className="w-full">
                            Cancel
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}