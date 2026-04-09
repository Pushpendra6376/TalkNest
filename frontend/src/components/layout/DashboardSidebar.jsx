import { Link, useLocation, useNavigate } from "react-router-dom"
import { Bot, LogOut, MessagesSquare, Settings, Star } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useConversations } from "@/hooks/use-conversations"
import { cn } from "@/lib/utils"
import { Separator } from "../ui/separator"
import { useMemo, useCallback } from "react"

const NAV_ITEMS = [
    {
        label: "Conversations",
        href: "/user/conversations",
        icon: MessagesSquare,
        tooltip: "Conversations",
    },
    {
        label: "Starred Messages",
        href: "/user/starred",
        icon: Star,
        tooltip: "Starred Messages",
    },
]

export default function DashboardSidebar() {
    const { user, logout } = useAuth()
    const { conversationsList, aiChatbotConversationId } = useConversations()
    const { state, isMobile } = useSidebar()
    const location = useLocation()
    const navigate = useNavigate()

    // ✅ optimized unread count (memoized)
    const unreadChatsCount = useMemo(() => {
        if (!user?._id) return 0
        return conversationsList.reduce((count, c) => {
            const hasUnread = c.unreadCounts?.some(
                (u) => u.userId === user._id && u.count > 0
            )
            return hasUnread ? count + 1 : count
        }, 0)
    }, [conversationsList, user?._id])

    // ✅ optimized logout handler
    const handleLogout = useCallback(() => {
        logout()
        navigate("/", { replace: true })
    }, [logout, navigate])

    // ✅ safe initials
    const initials = useMemo(() => {
        if (!user?.name) return "?"
        return user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }, [user?.name])

    return (
        <Sidebar collapsible="icon">
            {/* ── NAV ───────────────────────── */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu
                            className={cn(
                                "mt-1 w-full",
                                !isMobile && state === "collapsed" && "items-center"
                            )}
                        >
                            {NAV_ITEMS.map(({ label, href, icon: Icon, tooltip }) => {
                                const isActive =
                                    href === "/user/conversations"
                                        ? location.pathname.startsWith("/user/conversations")
                                        : location.pathname === href

                                const isConversations = href === "/user/conversations"
                                const showBadge = isConversations && unreadChatsCount > 0

                                return (
                                    <SidebarMenuItem key={label} className="min-w-10 min-h-10">
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            title={tooltip}
                                            className={cn(
                                                "min-w-10 min-h-10 p-4 transition-all duration-150",
                                                isActive && "bg-muted/60"
                                            )}
                                        >
                                            <Link to={href} className="flex items-center gap-2">
                                                {/* icon */}
                                                <div className="relative shrink-0">
                                                    <Icon className="min-h-5 min-w-5 text-muted-foreground" />

                                                    {/* collapsed badge */}
                                                    {showBadge && state === "collapsed" && (
                                                        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                                                            {unreadChatsCount > 9 ? "9+" : unreadChatsCount}
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="truncate">{label}</span>
                                            </Link>
                                        </SidebarMenuButton>

                                        {/* expanded badge */}
                                        {showBadge && (
                                            <SidebarMenuBadge className="bg-primary text-white rounded-full">
                                                {unreadChatsCount > 99 ? "99+" : unreadChatsCount}
                                            </SidebarMenuBadge>
                                        )}
                                    </SidebarMenuItem>
                                )
                            })}

                            <Separator className="mt-2 mb-3" />

                            {/* AI CHATBOT */}
                            <SidebarMenuItem className="min-w-10 min-h-10">
                                <SidebarMenuButton
                                    asChild
                                    className={cn(
                                        "min-w-10 min-h-10 p-4 border-2 border-primary bg-primary text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]",
                                        state === "collapsed" && "rounded-full"
                                    )}
                                >
                                    <Link
                                        to={`/user/conversations/${aiChatbotConversationId}`}
                                        className="flex items-center gap-2"
                                    >
                                        <Bot className="min-h-5 min-w-5" />
                                        <span>AI Chatbot</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ── FOOTER ───────────────────── */}
            <SidebarFooter>
                <SidebarMenu
                    className={cn(
                        "w-full mb-1",
                        !isMobile && state === "collapsed" && "items-center"
                    )}
                >
                    {/* SETTINGS */}
                    <SidebarMenuItem className="flex min-w-10 min-h-10 items-center justify-center">
                        <SidebarMenuButton asChild title="Account Settings">
                            <Link to="/user/profile" className="flex items-center gap-2">
                                <Settings className="min-h-5 min-w-5 text-muted-foreground" />
                                <span>Account Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <Separator className="mb-2" />

                    {/* USER INFO */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="cursor-default hover:bg-transparent p-1"
                        >
                            <Avatar className="size-7 shrink-0 rounded-lg">
                                <AvatarImage src={user?.profilePic} alt={user?.name} />
                                <AvatarFallback className="rounded-lg bg-primary/20 text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium">
                                    {user?.name}
                                </span>

                                {state === "expanded" && (
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user?.email}
                                    </span>
                                )}
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* LOGOUT */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            title="Log out"
                            onClick={handleLogout}
                            className="text-destructive hover:bg-destructive/10 transition-all duration-150"
                        >
                            <LogOut className="min-h-5 min-w-5" />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}