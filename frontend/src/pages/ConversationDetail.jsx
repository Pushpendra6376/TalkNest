import { useEffect, useRef, useCallback, useState, useMemo } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { useConversations } from "@/hooks/use-conversations"
import { conversationApi, messageApi, userApi } from "@/lib/api"
import socket, {
  emitJoinChat,
  emitLeaveChat,
  emitDeleteMessage,
} from "@/lib/socket"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import ConversationDetailHeader from "@/components/dashboard/ConversationDetailHeader"
import SingleMessage from "@/components/dashboard/SingleMessage"
import MessageInput from "@/components/dashboard/MessageInput"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

import { Trash2 } from "lucide-react"

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

import { toast } from "sonner"

/* ─── CSS typing indicator ─────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-[75%] mr-auto">
      <div className="px-4 py-3 bg-muted rounded-2xl rounded-bl-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── streaming bot bubble ──────────────────────────────────────────────── */
function StreamingBotBubble({ text }) {
  return (
    <div className="flex items-end gap-2 max-w-[85%] mr-auto">
      <div className="px-3.5 py-2 text-sm shadow-sm bg-muted text-foreground rounded-2xl rounded-bl-sm">
        <div
          className="text-sm leading-relaxed prose prose-sm max-w-none
          prose-p:my-1 prose-p:leading-relaxed
          prose-headings:font-semibold prose-headings:my-1
          prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
          prose-ul:my-1 prose-ul:pl-4
          prose-ol:my-1 prose-ol:pl-4
          prose-li:my-0
          prose-pre:bg-black/10 prose-pre:rounded prose-pre:px-2 prose-pre:py-1 prose-pre:text-xs prose-pre:my-1
          prose-code:bg-black/10 prose-code:rounded prose-code:px-1 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
          prose-blockquote:border-l-2 prose-blockquote:pl-2 prose-blockquote:my-1 prose-blockquote:text-muted-foreground
          prose-strong:font-semibold
          prose-a:underline
          dark:prose-invert"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {text}
          </ReactMarkdown>
        </div>

        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-muted-foreground/60 align-middle animate-pulse rounded-sm" />
      </div>
    </div>
  )
}

/* ─── message list skeleton ─────────────────────────────────────────────── */
function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {[60, 40, 75, 35, 55].map((w, i) => (
        <div
          key={i}
          className={`flex ${
            i % 2 === 0 ? "justify-start" : "justify-end"
          }`}
        >
          <Skeleton
            className="h-9 rounded-2xl"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  )
}

/* ─── date divider ──────────────────────────────────────────────────────── */
function DateDivider({ date }) {
  const label = (() => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return "Today"
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday"

    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  })()

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────────────────── */
export default function ConversationDetail() {
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const {
    receiver,
    setReceiver,
    messageList,
    setMessageList,
    setActiveChatId,
    typingConversations,
    isOtherUserTyping,
    setIsOtherUserTyping,
    isChatLoading,
    setIsChatLoading,
  } = useChat()

  const { setConversationsList } = useConversations()

  const scrollAreaRef = useRef(null)
  const isInitialLoadRef = useRef(true)
  const hasInitiallyScrolledRef = useRef(false)
  const prevMessageCountRef = useRef(0)
  const pendingSeenRef = useRef([])

  const [streamingBot, setStreamingBot] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState(null)

  /* block status */
  const [fetchedBlockStatus, setBlockStatus] = useState({
    iBlockedThem: false,
    theyBlockedMe: false,
  })

  const blockStatus = useMemo(() => {
    if (!receiver || receiver.isBot) {
      return { iBlockedThem: false, theyBlockedMe: false }
    }
    return fetchedBlockStatus
  }, [receiver, fetchedBlockStatus])

  /* ── fetch block status ───────────────── */
  useEffect(() => {
    if (!receiver || receiver.isBot) return
    userApi
      .getBlockStatus(receiver._id || receiver.id)
      .then((status) => setBlockStatus(status))
      .catch(() => {})
  }, [receiver?._id, receiver?.id])

  /* ── block/unblock ───────────────── */
  const handleBlock = useCallback(async () => {
    if (!receiver) return
    try {
      await userApi.blockUser(receiver._id || receiver.id)
      setBlockStatus((prev) => ({ ...prev, iBlockedThem: true }))
      toast.success(`${receiver.name} has been blocked`)
    } catch {
      toast.error("Failed to block user")
    }
  }, [receiver])

  const handleUnblock = useCallback(async () => {
    if (!receiver) return
    try {
      await userApi.unblockUser(receiver._id || receiver.id)
      setBlockStatus((prev) => ({ ...prev, iBlockedThem: false }))
      toast.success(`${receiver.name} has been unblocked`)
    } catch {
      toast.error("Failed to unblock user")
    }
  }, [receiver])

  /* ── select mode ───────────────── */
  // Fix #18: was declared TWICE — removed the duplicate. Single declaration here.
  const exitSelectMode = useCallback(() => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  const enterSelectMode = useCallback(() => {
    setSelectedIds(new Set())
    setSelectMode(true)
  }, [])

  const handleToggleSelect = useCallback((msgId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(msgId)) next.delete(msgId)
      else next.add(msgId)
      return next
    })
  }, [])

  /* ── message actions ───────────────── */
  const handleDelete = useCallback(async (messageId, scope) => {
    // Fix #23: use socket emit for delete — consistent with real-time flow
    emitDeleteMessage({ messageId, conversationId: id, scope })

    // Optimistic UI update
    if (scope === "everyone") {
      setMessageList((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, softDeleted: true } : m
        )
      )
    } else {
      setMessageList((prev) => prev.filter((m) => m._id !== messageId))
    }
    toast.success("Message deleted")
  }, [id, setMessageList])

  const handleStar = useCallback(async (messageId) => {
    if (!user?._id) return
    try {
      await messageApi.toggleStar(messageId)
      setMessageList((prev) =>
        prev.map((m) => {
          if (m._id !== messageId) return m
          const starredBy = m.starredBy ?? []
          const hasStarred = starredBy.includes(user._id)
          return {
            ...m,
            starredBy: hasStarred
              ? starredBy.filter((sid) => sid !== user._id)
              : [...starredBy, user._id],
          }
        })
      )
    } catch {
      toast.error("Failed to star message")
    }
  }, [user?._id, setMessageList])

  const handleClearChat = useCallback(async () => {
    try {
      await messageApi.clearChat(id)
      setMessageList([])
      toast.success("Chat cleared")
    } catch {
      toast.error("Failed to clear chat")
    }
  }, [id, setMessageList])

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    try {
      await messageApi.bulkDelete(ids)
      setMessageList((prev) => prev.filter((m) => !selectedIds.has(m._id)))
      exitSelectMode()
      toast.success("Messages deleted")
    } catch {
      toast.error("Failed to delete messages")
    }
  }, [selectedIds, exitSelectMode, setMessageList])

  /* ── scroll ───────────────── */
  const scrollToBottom = useCallback((behavior = "smooth") => {
    requestAnimationFrame(() => {
      const el = scrollAreaRef.current
      if (!el) return
      if (behavior === "instant") {
        el.scrollTop = el.scrollHeight
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior })
      }
    })
  }, [])

  /* ── load conversation + messages ───────────────── */
  useEffect(() => {
    if (!id || !user) return

    let cancelled = false

    setIsChatLoading(true)
    setMessageList([])
    setActiveChatId(id)
    pendingSeenRef.current = []
    isInitialLoadRef.current = true
    hasInitiallyScrolledRef.current = false
    prevMessageCountRef.current = 0

    Promise.all([conversationApi.get(id), messageApi.list(id)])
      .then(([conv, msgs]) => {
        if (cancelled) return

        // Fix #20: check both ._id and .id — Sequelize returns `id` (integer),
        // and `_id` is a virtual field that may or may not be present.
        const other = conv.members.find(
          (m) => (m._id ?? m.id) !== (user._id ?? user.id)
        )
        setReceiver(other ?? null)

        const pending = pendingSeenRef.current
        const mergedMsgs =
          pending.length === 0
            ? msgs
            : msgs.map((m) => {
                const applicable = pending.filter(
                  (p) => !m.seenBy?.some((s) => s.user === p.seenBy)
                )
                if (applicable.length === 0) return m
                return {
                  ...m,
                  seenBy: [
                    ...(m.seenBy ?? []),
                    ...applicable.map((p) => ({
                      user: p.seenBy,
                      seenAt: p.seenAt,
                    })),
                  ],
                }
              })

        setMessageList(mergedMsgs)

        // Reset unread count for this conversation in the sidebar
        const myId = user._id ?? user.id
        setConversationsList((prev) =>
          prev.map((c) =>
            (c._id ?? c.id) === id
              ? {
                  ...c,
                  unreadCounts: c.unreadCounts.map((u) =>
                    u.userId === myId ? { ...u, count: 0 } : u
                  ),
                }
              : c
          )
        )
      })
      .catch(() => {
        if (cancelled) return
        toast.error("Failed to load conversation.")
        navigate("/user/conversations", { replace: true })
      })
      .finally(() => {
        if (!cancelled) setIsChatLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, user])

  /* ── Real-time socket listeners ───────────────── */
  // Fix #19: These listeners were MISSING — new messages never appeared in real-time.
  useEffect(() => {
    if (!id) return

    /* New message arrived in this conversation */
    const onReceiveMessage = (message) => {
      if (String(message.conversationId) !== String(id)) return
      setMessageList((prev) => {
        // Deduplicate: don't add if already in list (e.g. optimistic update)
        if (prev.some((m) => m._id === message._id)) return prev
        return [...prev, message]
      })
      // Update sidebar preview
      setConversationsList((prev) =>
        prev.map((c) =>
          (c._id ?? c.id) === id
            ? { ...c, latestmessage: message.text ?? "sent an image", updatedAt: new Date().toISOString() }
            : c
        )
      )
    }

    /* Message deleted (soft or hard) */
    const onMessageDeleted = ({ messageId, conversationId: cid, softDeleted }) => {
      if (String(cid) !== String(id)) return
      if (softDeleted) {
        setMessageList((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, softDeleted: true } : m
          )
        )
      } else {
        setMessageList((prev) => prev.filter((m) => m._id !== messageId))
      }
    }

    /* Someone has seen messages */
    const onMessagesSeen = ({ conversationId: cid, seenBy, seenAt }) => {
      if (String(cid) !== String(id)) return
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

    /* Streaming AI bot chunks */
    const onBotChunk = ({ conversationId: cid, tempId, chunk }) => {
      if (String(cid) !== String(id)) return
      setStreamingBot((prev) => ({
        conversationId: cid,
        tempId,
        text: (prev?.tempId === tempId ? prev.text : "") + chunk,
      }))
    }

    /* Bot stream done — replace streaming bubble with final message */
    const onBotDone = ({ conversationId: cid, message }) => {
      if (String(cid) !== String(id)) return
      setStreamingBot(null)
      setMessageList((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev
        return [...prev, message]
      })
      setConversationsList((prev) =>
        prev.map((c) =>
          (c._id ?? c.id) === id
            ? { ...c, latestmessage: message.text ?? "sent an image", updatedAt: new Date().toISOString() }
            : c
        )
      )
    }

    /* Bot stream errored */
    const onBotError = ({ conversationId: cid, userMessageId }) => {
      if (String(cid) !== String(id)) return
      setStreamingBot(null)
      // Remove the user message that triggered the error (no bot response)
      if (userMessageId) {
        setMessageList((prev) => prev.filter((m) => m._id !== userMessageId))
      }
      toast.error("AI response failed. Please try again.")
    }

    /* Other user joined / left the chat room */
    const onBlocked = ({ conversationId: cid }) => {
      if (String(cid) !== String(id)) return
      toast.error("Message not delivered — you can't send messages to this user.")
    }

    socket.on("receive-message", onReceiveMessage)
    socket.on("message-deleted", onMessageDeleted)
    socket.on("messages-seen", onMessagesSeen)
    socket.on("bot-chunk", onBotChunk)
    socket.on("bot-done", onBotDone)
    socket.on("bot-error", onBotError)
    socket.on("message-blocked", onBlocked)

    return () => {
      socket.off("receive-message", onReceiveMessage)
      socket.off("message-deleted", onMessageDeleted)
      socket.off("messages-seen", onMessagesSeen)
      socket.off("bot-chunk", onBotChunk)
      socket.off("bot-done", onBotDone)
      socket.off("bot-error", onBotError)
      socket.off("message-blocked", onBlocked)
    }
  }, [id, setMessageList, setConversationsList])

  /* ── scroll to highlighted message ───────────────── */
  // Fix #21: parse targetId once — don't recalculate on every messageList change
  const targetHighlightId = searchParams.get("highlight")

  useEffect(() => {
    if (!targetHighlightId || messageList.length === 0) return
    let highlightTimer

    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-message-id="${targetHighlightId}"]`
      )
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlightedMessageId(targetHighlightId)
        highlightTimer = setTimeout(() => setHighlightedMessageId(null), 2200)
      }
    })

    return () => clearTimeout(highlightTimer)
  }, [targetHighlightId, messageList.length]) // only messageList.length, not full list

  /* ── auto scroll ───────────────── */
  useEffect(() => {
    if (messageList.length === 0) return

    const prevCount = prevMessageCountRef.current
    const currentCount = messageList.length
    prevMessageCountRef.current = currentCount

    if (currentCount === prevCount) return

    if (!hasInitiallyScrolledRef.current) {
      hasInitiallyScrolledRef.current = true
      isInitialLoadRef.current = false
      if (!targetHighlightId) scrollToBottom("instant")
      return
    }

    scrollToBottom("smooth")
  }, [messageList, scrollToBottom, targetHighlightId])

  /* ── join/leave room ───────────────── */
  useEffect(() => {
    if (!id) return

    emitJoinChat(id)

    return () => {
      emitLeaveChat(id)
      setActiveChatId("")
      setReceiver(null)
    }
  }, [id])

  /* ── group messages by date ───────────────── */
  const grouped = useMemo(() => {
    const list = []
    let lastDate = null

    messageList.forEach((msg) => {
      if (!msg.createdAt) return
      const msgDate = new Date(msg.createdAt).toDateString()
      if (msgDate !== lastDate) {
        list.push(msg.createdAt)
        lastDate = msgDate
      }
      list.push(msg)
    })

    return list
  }, [messageList])

  const myId = user?._id ?? user?.id ?? ""

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <ConversationDetailHeader
        receiver={receiver}
        onClearChat={handleClearChat}
        onSelectMode={enterSelectMode}
        isBlockedByMe={blockStatus.iBlockedThem}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
      />

      {/* Messages */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5"
      >
        {isChatLoading ? (
          <MessagesSkeleton />
        ) : messageList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <p className="text-sm">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          grouped.map((item, idx) => {
            if (typeof item === "string") {
              return <DateDivider key={`div-${idx}`} date={item} />
            }

            const msg = item
            const isMine = (msg.senderId ?? msg.sender_id) === myId

            return (
              <SingleMessage
                key={msg._id}
                message={msg}
                isMine={isMine}
                isBot={receiver?.isBot && !isMine}
                receiverId={receiver?._id ?? receiver?.id ?? ""}
                myId={myId}
                receiverName={receiver?.name ?? ""}
                onDelete={handleDelete}
                onStar={handleStar}
                onReply={setReplyingTo}
                selectMode={selectMode}
                selected={selectedIds.has(msg._id)}
                onToggleSelect={handleToggleSelect}
                highlighted={highlightedMessageId === msg._id}
              />
            )
          })
        )}

        {/* Typing indicator */}
        {isOtherUserTyping && !(streamingBot?.conversationId === id) && (
          <TypingIndicator />
        )}

        {/* Streaming bot */}
        {streamingBot?.conversationId === id && (
          <StreamingBotBubble text={streamingBot.text} />
        )}
      </div>

      {/* Input */}
      {user && !selectMode && (
        <MessageInput
          conversationId={id}
          myId={myId}
          receiverId={receiver?._id ?? receiver?.id ?? ""}
          receiverName={receiver?.name ?? ""}
          isReceiverBot={receiver?.isBot ?? false}
          isBlocked={blockStatus.iBlockedThem}
          blockedByThem={blockStatus.theyBlockedMe}
          replyToMessage={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      )}

      {/* Bulk delete bar */}
      {selectMode && (
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t bg-background">
          <Button variant="outline" size="sm" onClick={exitSelectMode} className="gap-1.5">
            Cancel
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={() => setBulkDeleteOpen(true)}
            className="gap-1.5"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      )}

      {/* Bulk delete dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} message
              {selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The selected{" "}
              {selectedIds.size !== 1 ? "messages" : "message"}{" "}
              will be removed from your view. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setBulkDeleteOpen(false)
                handleBulkDelete()
              }}
            >
              Delete for me
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}