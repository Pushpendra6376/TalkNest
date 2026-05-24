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
          prose-a: prose-a:underline
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

    if (d.toDateString() === today.toDateString()) {
      return "Today"
    }

    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }

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

  /* streaming bot */
  const [streamingBot, setStreamingBot] = useState(null)

  /* reply */
  const [replyingTo, setReplyingTo] = useState(null)

  /* highlight */
  const [highlightedMessageId, setHighlightedMessageId] = useState(null)

  /* block */
  const [fetchedBlockStatus, setBlockStatus] = useState({
    iBlockedThem: false,
    theyBlockedMe: false,
  })

  const blockStatus = useMemo(() => {
    if (!receiver || receiver.isBot) {
      return {
        iBlockedThem: false,
        theyBlockedMe: false,
      }
    }

    return fetchedBlockStatus
  }, [receiver, fetchedBlockStatus])

  /* ── fetch block status ───────────────── */
  useEffect(() => {
    if (!receiver || receiver.isBot) return

    userApi
      .getBlockStatus(receiver._id)
      .then((status) => setBlockStatus(status))
      .catch(() => {})
  }, [receiver?._id])

  /* ── block/unblock ───────────────── */
  const handleBlock = useCallback(async () => {
    if (!receiver) return

    try {
      await userApi.blockUser(receiver._id)

      setBlockStatus((prev) => ({
        ...prev,
        iBlockedThem: true,
      }))

      toast.success(`${receiver.name} has been blocked`)
    } catch {
      toast.error("Failed to block user")
    }
  }, [receiver])

  const handleUnblock = useCallback(async () => {
    if (!receiver) return

    try {
      await userApi.unblockUser(receiver._id)

      setBlockStatus((prev) => ({
        ...prev,
        iBlockedThem: false,
      }))

      toast.success(`${receiver.name} has been unblocked`)
    } catch {
      toast.error("Failed to unblock user")
    }
  }, [receiver])

  /* ── socket: message-blocked ───────────────── */
  useEffect(() => {
    const onBlocked = ({ conversationId: cid }) => {
      if (cid !== id) return

      toast.error(
        "Message not delivered — you can't send messages to this user."
      )
    }

    socket.on("message-blocked", onBlocked)

    return () => {
      socket.off("message-blocked", onBlocked)
    }
  }, [id])

  /* ── select mode ───────────────── */
  const [selectMode, setSelectMode] = useState(false)

  const [selectedIds, setSelectedIds] = useState(new Set())

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const enterSelectMode = useCallback(() => {
    setSelectedIds(new Set())
    setSelectMode(true)
  }, [])

  const exitSelectMode = useCallback(() => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleToggleSelect = useCallback((msgId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)

      if (next.has(msgId)) {
        next.delete(msgId)
      } else {
        next.add(msgId)
      }

      return next
    })
  }, [])

  const scrollToBottom = useCallback((behavior = "smooth") => {
    requestAnimationFrame(() => {
      const el = scrollAreaRef.current

      if (!el) return

      if (behavior === "instant") {
        el.scrollTop = el.scrollHeight
      } else {
        el.scrollTo({
          top: el.scrollHeight,
          behavior,
        })
      }
    })
  }, [])

  /* ── load conversation + messages ───────────────── */
  useEffect(() => {
    if (!id || !user) return

    // Guard against stale async results when `id` changes before fetch completes
    let cancelled = false

    setIsChatLoading(true)

    setMessageList([])

    setActiveChatId(id)

    pendingSeenRef.current = []

    isInitialLoadRef.current = true

    hasInitiallyScrolledRef.current = false

    prevMessageCountRef.current = 0

    Promise.all([
      conversationApi.get(id),
      messageApi.list(id),
    ])
      .then(([conv, msgs]) => {
        // Discard result if the user navigated away before this resolved
        if (cancelled) return

        const other = conv.members.find(
          (m) => m._id !== user._id
        )

        setReceiver(other ?? null)

        const pending = pendingSeenRef.current

        const mergedMsgs =
          pending.length === 0
            ? msgs
            : msgs.map((m) => {
                const applicable = pending.filter(
                  (p) =>
                    !m.seenBy?.some(
                      (s) => s.user === p.seenBy
                    )
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

        setConversationsList((prev) =>
          prev.map((c) =>
            c._id === id
              ? {
                  ...c,
                  unreadCounts: c.unreadCounts.map((u) =>
                    u.userId === user._id
                      ? { ...u, count: 0 }
                      : u
                  ),
                }
              : c
          )
        )
      })
      .catch(() => {
        if (cancelled) return

        toast.error("Failed to load conversation.")

        navigate("/user/conversations", {
          replace: true,
        })
      })
      .finally(() => {
        if (!cancelled) setIsChatLoading(false)
      })

    // When `id` or `user` changes, mark the previous fetch as stale
    return () => {
      cancelled = true
    }
  }, [id, user])

  /* ── scroll/highlight ───────────────── */
  useEffect(() => {
    const targetId = searchParams.get("highlight")

    if (!targetId || messageList.length === 0) return

    // Keep a ref to the timeout so we can cancel it on cleanup
    let highlightTimer

    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-message-id="${targetId}"]`
      )

      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })

        setHighlightedMessageId(targetId)

        highlightTimer = setTimeout(() => {
          setHighlightedMessageId(null)
        }, 2200)
      }
    })

    // Cancel the timer if the component unmounts or deps change before it fires
    return () => {
      clearTimeout(highlightTimer)
    }
  }, [searchParams, messageList])

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

      if (!searchParams.get("highlight")) {
        scrollToBottom("instant")
      }

      return
    }

    scrollToBottom("smooth")
  }, [messageList, scrollToBottom])

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
            <p className="text-sm">
              No messages yet. Say hi! 👋
            </p>
          </div>
        ) : (
          grouped.map((item, idx) => {
            if (typeof item === "string") {
              return (
                <DateDivider
                  key={`div-${idx}`}
                  date={item}
                />
              )
            }

            const msg = item

            const isMine = msg.senderId === user?._id

            return (
              <SingleMessage
                key={msg._id}
                message={msg}
                isMine={isMine}
                isBot={receiver?.isBot && !isMine}
                receiverId={receiver?._id ?? ""}
                myId={user?._id ?? ""}
                receiverName={receiver?.name ?? ""}
                onDelete={handleDelete}
                onStar={handleStar}
                onReply={setReplyingTo}
                selectMode={selectMode}
                selected={selectedIds.has(msg._id)}
                onToggleSelect={handleToggleSelect}
                highlighted={
                  highlightedMessageId === msg._id
                }
              />
            )
          })
        )}

        {/* Typing indicator */}
        {isOtherUserTyping &&
          !(streamingBot?.conversationId === id) && (
            <TypingIndicator />
          )}

        {/* Streaming bot */}
        {streamingBot?.conversationId === id && (
          <StreamingBotBubble
            text={streamingBot.text}
          />
        )}
      </div>

      {/* Input */}
      {user && !selectMode && (
        <MessageInput
          conversationId={id}
          myId={user._id}
          receiverId={receiver?._id ?? ""}
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
          <Button
            variant="outline"
            size="sm"
            onClick={exitSelectMode}
            className="gap-1.5"
          >
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

      {/* Dialog */}
      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} message
              {selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>

            <AlertDialogDescription>
              The selected{" "}
              {selectedIds.size !== 1
                ? "messages"
                : "message"}{" "}
              will be removed from your view. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

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