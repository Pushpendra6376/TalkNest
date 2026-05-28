import { Link, useLocation, useNavigate } from "react-router-dom"
import { LogOut, MessagesSquare, Settings, Star } from "lucide-react"
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
        label: "Settings",
        href: "/user/profile",
        icon: Settings,
        tooltip: "Settings",
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
    const { conversationsList } = useConversations()
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
    const handleLogout = (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        logout()
        navigate("/login", { replace: true })
    }

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
        <Sidebar collapsible="icon" className="border-r">
            {/* ── NAV ───────────────────────── */}
            <SidebarContent className="flex flex-col items-center gap-0 py-6 px-0">
                <SidebarGroup className="w-full p-0">
                    <SidebarGroupContent>
                        <SidebarMenu className="w-full flex flex-col items-center gap-2">
                            {NAV_ITEMS.map(({ label, href, icon: Icon, tooltip }) => {
                                const isActive =
                                    href === "/user/conversations"
                                        ? location.pathname.startsWith("/user/conversations")
                                        : location.pathname === href

                                const isConversations = href === "/user/conversations"
                                const showBadge = isConversations && unreadChatsCount > 0

                                return (
                                    <SidebarMenuItem key={label} className="min-w-10 min-h-10 w-full">
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            title={tooltip}
                                            className={cn(
                                                "h-10 w-10 p-0 rounded-lg transition-all duration-150 hover:bg-muted mx-auto",
                                                isActive && "bg-muted/80"
                                            )}
                                        >
                                            <Link to={href} className="flex items-center justify-center">
                                                <div className="relative shrink-0 flex items-center justify-center">
                                                    <Icon className="h-5 w-5 text-muted-foreground" />

                                                    {/* badge */}
                                                    {showBadge && (
                                                        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                                                            {unreadChatsCount > 9 ? "9+" : unreadChatsCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}

                            <Separator className="my-3 w-8" />

                            {/* USER PROFILE - BADGE STYLE */}
                            <SidebarMenuItem className="min-w-10 min-h-10 w-full flex justify-center">
                                <div
                                    className="h-10 w-10 p-0.5 rounded-lg mx-auto bg-yellow-400 flex items-center justify-center"
                                    title={user?.name}
                                >
                                    <Avatar className="h-9 w-9 rounded-md">
                                        <AvatarImage src={user?.profilePic} alt={user?.name} />
                                        <AvatarFallback className="rounded-md bg-yellow-400 text-xs font-bold text-gray-900">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </SidebarMenuItem>

                            <Separator className="my-3 w-8" />

                            {/* LOGOUT */}
                            <SidebarMenuItem className="min-w-10 min-h-10 w-full flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    title="Log out"
                                    className="h-10 w-10 p-2 rounded-lg transition-all duration-150 hover:bg-destructive/10 text-destructive mx-auto flex items-center justify-center cursor-pointer relative z-50"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ── FOOTER ───────────────────── */}
            <SidebarFooter />

            <SidebarRail />
        </Sidebar>
    )
}