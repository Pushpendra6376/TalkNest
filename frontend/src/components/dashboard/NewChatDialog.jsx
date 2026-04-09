import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Pin, Loader2, Circle } from "lucide-react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

import { userApi, conversationApi } from "@/lib/api"
import { useConversations } from "@/hooks/use-conversations"
import { useAuth } from "@/hooks/use-auth"

/* ─── constants ───────────────────────────────────────── */
const LIMIT = 20

/* ─── helpers ───────────────────────────────────────── */
function initials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(id)
    }, [value, delay])

    return debounced
}

function formatLastSeen(lastSeen) {
    if (!lastSeen) return "Last seen unknown"

    const diff = Date.now() - new Date(lastSeen).getTime()
    const secs = Math.floor(diff / 1000)
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (secs < 60) return "Last seen just now"
    if (mins < 60) return `Last seen ${mins}m ago`
    if (hrs < 24) return `Last seen ${hrs}h ago`
    if (days < 7) return `Last seen ${days}d ago`

    return `Last seen ${new Date(lastSeen).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    })}`
}

/* ─── user row ───────────────────────────────────────── */
function UserRow({ user, pinned = false, creating, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={creating}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-accent/60 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Avatar className="size-10 shrink-0">
                <AvatarImage src={user.profilePic} alt={user.name} />
                <AvatarFallback className="bg-primary/15 text-xs font-semibold">
                    {initials(user.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{user.name}</span>

                    {pinned && (
                        <Badge className="shrink-0 gap-0.5 text-[10px] h-4 px-1.5 py-0">
                            <Pin className="size-2.5" />
                            Dev
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                    {user.isOnline ? (
                        <>
                            <Circle className="size-1.5 fill-green-500 text-green-500 shrink-0" />
                            <span className="text-xs text-green-600 truncate">Online</span>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground truncate">
                            {formatLastSeen(user.lastSeen)}
                        </span>
                    )}
                </div>
            </div>
        </button>
    )
}

function UserRowSkeleton() {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    )
}

/* ─── main component ───────────────────────────────────────── */
export default function NewChatDialog({ open, onOpenChange }) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { fetchConversations } = useConversations()

    const [query, setQuery] = useState("")
    const [sort, setSort] = useState("name_asc")
    const [users, setUsers] = useState([])
    const [pinnedUser, setPinnedUser] = useState(null)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [creating, setCreating] = useState(null)

    const debouncedQuery = useDebounce(query, 350)
    const sentinelRef = useRef(null)
    const listRef = useRef(null)

    const fetchPage = useCallback(async (pg, q, s, append) => {
        if (pg === 1) setLoading(true)
        else setLoadingMore(true)

        try {
            const data = await userApi.getNonFriends({
                search: q || undefined,
                sort: s,
                page: pg,
                limit: LIMIT,
            })

            if (append) {
                setUsers((prev) => [...prev, ...data.users])
            } else {
                setUsers(data.users)
                setPinnedUser(data.pinnedUser)
                if (listRef.current) listRef.current.scrollTop = 0
            }

            setHasMore(data.hasMore)
            setPage(pg)
        } catch {
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [])

    useEffect(() => {
        if (!open) return
        fetchPage(1, debouncedQuery, sort, false)
    }, [open, debouncedQuery, sort, fetchPage])

    useEffect(() => {
        if (!open) {
            setQuery("")
            setUsers([])
            setPinnedUser(null)
            setPage(1)
            setHasMore(false)
        }
    }, [open])

    useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel) return

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                fetchPage(page + 1, debouncedQuery, sort, true)
            }
        })

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasMore, loadingMore, loading, page, debouncedQuery, sort, fetchPage])

    const handleStartChat = async (userId) => {
        if (!user) return
        setCreating(userId)

        try {
            const conv = await conversationApi.create([user._id, userId])
            await fetchConversations()
            onOpenChange(false)
            navigate(`/user/conversations/${conv._id}`)
        } catch (err) {
            toast.error(err?.message || "Failed to create conversation")
        } finally {
            setCreating(null)
        }
    }

    const isSearching = debouncedQuery.trim().length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[85vh]">
                <DialogHeader className="px-4 pt-7 pb-3">
                    <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>

                {/* Search + Sort */}
                <div className="px-4 pb-3 space-y-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Search by name or email…"
                            className="pl-8 h-9"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Sort by…" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name_asc">Name - A → Z</SelectItem>
                            <SelectItem value="name_desc">Name - Z → A</SelectItem>
                            <SelectItem value="last_seen_recent">Last seen - most recent</SelectItem>
                            <SelectItem value="last_seen_oldest">Last seen - least recent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* List */}
                <div ref={listRef} className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <UserRowSkeleton key={i} />)
                    ) : (
                        <>
                            {!isSearching && pinnedUser && (
                                <UserRow
                                    user={pinnedUser}
                                    pinned
                                    creating={creating === pinnedUser._id}
                                    onClick={() => handleStartChat(pinnedUser._id)}
                                />
                            )}

                            {users.map((u) => (
                                <UserRow
                                    key={u._id}
                                    user={u}
                                    creating={creating === u._id}
                                    onClick={() => handleStartChat(u._id)}
                                />
                            ))}

                            <div ref={sentinelRef} className="h-1" />

                            {loadingMore && (
                                <div className="flex justify-center py-3">
                                    <Loader2 className="size-4 animate-spin" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}