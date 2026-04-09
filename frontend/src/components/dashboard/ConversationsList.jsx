import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, MessageCircle, Bot, SquarePen, ChevronDown, Trash2, ShieldX, Pin, PinOff } from "lucide-react";

import { useConversations } from "@/hooks/use-conversations";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { userApi, messageApi, conversationApi } from "@/lib/api";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { Button } from "../ui/button";
import NewChatDialog from "./NewChatDialog";

/* helpers */
function getOtherMember(conv, myId) {
  return conv.members.find((m) => m._id !== myId);
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;

  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function initials(name) {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* skeleton */
function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="size-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

/* row */
function ConversationRow({
  conv,
  myId,
  isActive,
  isTyping,
  onClick,
  openDropdownId,
  setOpenDropdownId,
  onToggleBlock,
  onClearChat,
  onTogglePin,
  blockedUsers,
}) {
  const other = getOtherMember(conv, myId);
  const unread =
    conv.unreadCounts.find((u) => u.userId === myId)?.count ?? 0;

  const name = other?.name ?? "Unknown";
  const preview = isTyping
    ? "typing..."
    : conv.latestmessage || "Start a conversation";

  const dropdownOpen = openDropdownId === conv._id;
  const isBlocked = other ? blockedUsers.has(other._id) : false;
  const isPinned = conv.isPinned;

  return (
    <div className="relative group">
      {!other?.isBot && (
        <div
          className={cn(
            "absolute right-2 top-3.5 z-10 transition-opacity",
            dropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu
            open={dropdownOpen}
            onOpenChange={(open) =>
              setOpenDropdownId(open ? conv._id : null)
            }
          >
            <DropdownMenuTrigger asChild>
              <button className="size-5 rounded-md bg-gray-200/60 hover:bg-gray-200/90 flex items-center justify-center">
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(conv._id);
                }}
              >
                {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                {isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (other) onToggleBlock(other._id, other.name, isBlocked);
                }}
                className="text-red-500"
              >
                <ShieldX className="size-4" />
                {isBlocked ? "Unblock" : "Block"}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onClearChat(conv._id);
                }}
                className="text-red-500"
              >
                <Trash2 className="size-4" />
                Clear chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer",
          isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
        )}
      >
        <Avatar className="size-10">
          <AvatarImage src={other?.profilePic} />
          <AvatarFallback>
            {other?.isBot ? <Bot /> : initials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="text-[10px] text-muted-foreground">
              {relativeTime(conv.updatedAt)}
            </span>
          </div>

          <div className="flex justify-between mt-1">
            <p className="truncate text-xs">{preview}</p>

            {unread > 0 && (
              <span className="bg-primary text-white text-[10px] px-1 rounded-full">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* main */
export default function ConversationsList() {
  const { conversationsList, setConversationsList, fetchConversations, isLoading } =
    useConversations();

  const { user } = useAuth();
  const { typingConversations } = useChat();

  const navigate = useNavigate();
  const { id: activeId } = useParams();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState(
    new Set((user?.blockedUsers ?? []).map(String))
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const displayList = conversationsList.filter((conv) => {
    const other = getOtherMember(conv, user?._id ?? "");

    if (query && !other?.name?.toLowerCase().includes(query.toLowerCase()))
      return false;

    return true;
  });

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex justify-between px-4 py-2">
        <h1 className="font-bold">Chats</h1>
        <Button onClick={() => setNewChatOpen(true)}>
          <SquarePen />
        </Button>
      </div>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} />

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <ConversationSkeleton key={i} />
          ))
        ) : displayList.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No conversations
          </div>
        ) : (
          displayList.map((conv) => (
            <ConversationRow
              key={conv._id}
              conv={conv}
              myId={user?._id ?? ""}
              isActive={conv._id === activeId}
              isTyping={!!typingConversations[conv._id]}
              onClick={() =>
                navigate(`/user/conversations/${conv._id}`)
              }
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              onToggleBlock={() => {}}
              onClearChat={() => {}}
              onTogglePin={() => {}}
              blockedUsers={blockedUsers}
            />
          ))
        )}
      </div>
    </div>
  );
}   