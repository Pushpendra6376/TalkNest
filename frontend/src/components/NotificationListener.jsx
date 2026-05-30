import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import socket from "@/lib/socket"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { useConversations } from "@/hooks/use-conversations"
import notificationSound from "@/assets/newmessage.wav"
import { LS_NOTIF_BANNERS, LS_NOTIF_SOUND } from "@/pages/UserProfile"

function initials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

// Audio is created once at module level (outside the component) so it is
// never re-created on re-renders and never leaks.
const notificationAudio = new Audio(notificationSound)
notificationAudio.preload = "auto"

export default function NotificationListener() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { activeChatId, setMessageList } = useChat()
    const { setConversationsList } = useConversations()

    const activeChatIdRef = useRef(activeChatId)
    const myIdRef = useRef(user?._id ?? user?.id ?? null)

    useEffect(() => {
        activeChatIdRef.current = activeChatId
    }, [activeChatId])

    useEffect(() => {
        myIdRef.current = user?._id ?? user?.id ?? null
    }, [user])

    // Global messages-seen listener — runs at app level so the sender gets the
    // blue tick update even when they are viewing a different conversation.
    // The backend now emits messages-seen to the sender's personal room (userId)
    // in addition to the conversation room, so this always fires.
    useEffect(() => {
        const onMessagesSeen = ({ conversationId: cid, seenBy, seenAt }) => {
            // Only update the active message list if it belongs to this conversation
            if (String(cid) !== String(activeChatIdRef.current)) return
            setMessageList((prev) =>
                prev.map((m) => {
                    const alreadySeen = (m.seenBy ?? []).some(
                        (s) => String(s.user) === String(seenBy)
                    )
                    if (alreadySeen) return m
                    return {
                        ...m,
                        seenBy: [...(m.seenBy ?? []), { user: seenBy, seenAt }],
                    }
                })
            )
        }

        socket.on("messages-seen", onMessagesSeen)
        return () => socket.off("messages-seen", onMessagesSeen)
    }, [setMessageList])

    // Guaranteed sidebar update for ALL members — fires on every new message
    // via each member's personal room. Handles unread count via upsert so it
    // works even when unreadCounts starts as an empty array [].
    useEffect(() => {
        const onPreviewUpdated = ({ conversationId: cid, latestmessage, updatedAt, senderId }) => {
            setConversationsList((prev) => {
                const updated = prev.map((c) => {
                    if (String(c._id ?? c.id) !== String(cid)) return c

                    const myId = myIdRef.current
                    const isThisChatOpen = String(activeChatIdRef.current) === String(cid)
                    const iAmSender = String(myId) === String(senderId)

                    // Don't touch unread count if: (a) I sent this message, or (b) this chat is open
                    let updatedCounts = c.unreadCounts ?? []
                    if (!isThisChatOpen && !iAmSender) {
                        // Upsert: find my entry and increment, or add a new entry with count 1
                        const idx = updatedCounts.findIndex(
                            (u) => String(u.userId) === String(myId)
                        )
                        if (idx !== -1) {
                            updatedCounts = updatedCounts.map((u, i) =>
                                i === idx ? { ...u, count: (u.count ?? 0) + 1 } : u
                            )
                        } else {
                            updatedCounts = [...updatedCounts, { userId: myId, count: 1 }]
                        }
                    }

                    return { ...c, latestmessage, updatedAt, unreadCounts: updatedCounts }
                })

                // Re-sort: pinned first, then newest on top
                return [
                    ...updated.filter((c) => c.isPinned),
                    ...updated
                        .filter((c) => !c.isPinned)
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
                ]
            })
        }

        socket.on("conversation-preview-updated", onPreviewUpdated)
        return () => socket.off("conversation-preview-updated", onPreviewUpdated)
    }, [setConversationsList])

    useEffect(() => {
        const audio = notificationAudio

        const onNotification = (data) => {
            const { message, sender } = data
            const convId = message.conversationId

            // NOTE: unreadCounts are updated by conversation-preview-updated (always fires).
            // new-message-notification only handles toast + sound to avoid double-counting.
            // But we still handle the edge case: if this conv isn't in the list yet, add it.
            setConversationsList((prev) => {
                const idx = prev.findIndex((c) => String(c._id ?? c.id) === String(convId))
                if (idx !== -1) return prev  // already in list — preview-updated handles it

                // New conversation not yet in the list: add it
                const newConv = {
                    ...data.conversation,
                    latestmessage: message.text ?? "sent an image",
                    updatedAt: new Date().toISOString(),
                }
                return [newConv, ...prev]
            })

            // skip if already inside chat
            if (activeChatIdRef.current === convId) return

            // sound
            const soundEnabled = localStorage.getItem(LS_NOTIF_SOUND) !== "false"
            if (soundEnabled) {
                notificationAudio.currentTime = 0
                notificationAudio.play().catch(() => {})
            }

            // toast
            const bannersEnabled = localStorage.getItem(LS_NOTIF_BANNERS) !== "false"
            if (!bannersEnabled) return

            toast.custom(
                (t) => (
                    <div className="flex items-center gap-3 bg-background border rounded-xl shadow-lg px-4 py-3 w-85 max-w-[95vw]">
                        <Avatar className="size-10 shrink-0">
                            <AvatarImage src={sender.profilePic} alt={sender.name} />
                            <AvatarFallback className="bg-primary/15 text-xs font-semibold">
                                {sender.isBot ? (
                                    <Bot className="size-4" />
                                ) : (
                                    initials(sender.name)
                                )}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                                {sender.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {message.text ?? "sent an image"}
                            </p>
                        </div>

                        <Button
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => {
                                toast.dismiss(t)
                                navigate(`/user/conversations/${convId}`)
                            }}
                        >
                            Open
                        </Button>
                    </div>
                ),
                {
                    position: "top-right",
                    duration: 5000,
                }
            )
        }

        socket.on("new-message-notification", onNotification)

        return () => {
            socket.off("new-message-notification", onNotification)
        }
    }, [navigate, setConversationsList])

    return null
}