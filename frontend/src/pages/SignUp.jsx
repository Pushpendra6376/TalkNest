import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, ArrowLeft, MessageCircle, Zap, Shield, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

// Floating feature cards shown on large screens
const spotlights = [
    {
        title: "Lightning fast",
        desc: "Messages delivered instantly via WebSocket connections.",
        icon: Zap,
        side: "left",
        top: "20%",
    },
    {
        title: "Private & secure",
        desc: "Your conversations stay between you and the people you trust.",
        icon: Shield,
        side: "left",
        top: "52%",
    },
    {
        title: "Personal AI Chatbot",
        desc: "Chat with your own AI assistant, powered by Gemini.",
        icon: Bot,
        side: "right",
        top: "20%",
    },
    {
        title: "Passwordless login",
        desc: "Sign in instantly with a one-time code sent to your inbox.",
        icon: MessageCircle,
        side: "right",
        top: "52%",
    },
]

export default function SignUp() {
    const navigate = useNavigate()
    const { register, user } = useAuth()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    // Redirect if already logged in
    useEffect(() => {
        if (user) navigate("/user/conversations", { replace: true })
    }, [user, navigate])

    const validate = () => {
        if (!name.trim()) return "Please enter your name."
        if (!email.trim()) return "Please enter your email address."
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address."
        if (password.length < 6) return "Password must be at least 6 characters."
        if (password !== confirmPassword) return "Passwords do not match."
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const validationError = validate()

        if (validationError) {
            toast.error(validationError)
            return
        }

        setLoading(true)

        try {
            await register(name.trim(), email.trim().toLowerCase(), password)
            // Fix #26: navigate to /verify-email, not /user/conversations.
            // DashboardLayout would redirect unverified users there anyway,
            // causing a visible flash. Going directly avoids it.
            navigate("/verify-email", { replace: true })
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Registration failed. Try again.")
        } finally {
            setLoading(false)
        }
    }

    // Fix #27: memoize so passwordStrength is not recomputed on every render
    const strength = useMemo(() => {
        if (!password) return null
        if (password.length < 6) return { level: 1, label: "Weak", color: "bg-destructive" }
        if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
            return { level: 2, label: "Fair", color: "bg-amber-400" }
        return { level: 3, label: "Strong", color: "bg-green-500" }
    }, [password])

    return (
        <div className="relative h-full overflow-hidden bg-background">
            {/* ── Spotlight cards – visible on large screens only ─────── */}
            {spotlights.map((s) => {
                const Icon = s.icon

                return (
                    <div
                        key={s.title}
                        className="pointer-events-none absolute hidden xl:flex flex-col gap-2 w-56 p-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg shadow-black/5 dark:shadow-black/20"
                        style={{
                            [s.side]: "calc(50% - 340px - 240px)",
                            top: s.top,
                            transform: "translateX(0)",
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" />
                            </span>

                            <p className="text-sm font-semibold">
                                {s.title}
                            </p>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {s.desc}
                        </p>
                    </div>
                )
            })}

            {/* ── Scrollable center column ────────────────────────────── */}
            <div className="relative z-10 h-full overflow-y-auto flex flex-col items-center justify-center px-4 py-10">
                <div className="w-full max-w-md flex flex-col gap-6">

                    {/* Brand */}
                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                            <MessageCircle
                                className="h-7 w-7 text-primary"
                                strokeWidth={1.8}
                            />
                        </div>

                        <div>
                            <h1 className="text-5xl font-bold tracking-tight leading-none text-foreground">
                                TalkNest
                            </h1>

                            <p className="mt-1.5 text-sm text-muted-foreground">
                                Chat with anyone, anywhere, instantly.
                            </p>
                        </div>
                    </div>

                    {/* Form card */}
                    <Card className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xs shadow-xl shadow-black/5 dark:shadow-black/25 p-8 w-full">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                Create an account
                            </h2>

                            <p className="text-sm text-muted-foreground mt-2">
                                Fill in the details below to get started
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Full name
                                </Label>

                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Jane Doe"
                                    autoComplete="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                    className="h-11 rounded-lg bg-background/50 border-border"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email address
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="h-11 rounded-lg bg-background/50 border-border"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>

                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPass ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        className="h-11 pr-11 rounded-lg bg-background/50 border-border"
                                    />

                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPass((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPass ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                {strength && (
                                    <div className="space-y-2 pt-1">
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 rounded-full transition-all ${
                                                        i <= strength.level
                                                            ? strength.color
                                                            : "bg-muted/40"
                                                    }`}
                                                />
                                            ))}
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            Strength:{" "}
                                            <span className={`font-medium ${
                                                strength.level === 1 ? "text-destructive" :
                                                strength.level === 2 ? "text-amber-400" :
                                                "text-green-500"
                                            }`}>
                                                {strength.label}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                    Confirm password
                                </Label>

                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Repeat your password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                        className={`h-11 pr-11 rounded-lg bg-background/50 border-border ${
                                            confirmPassword &&
                                            confirmPassword !== password
                                                ? "border-destructive focus-visible:ring-destructive/20"
                                                : ""
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showConfirm ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {confirmPassword &&
                                    confirmPassword !== password && (
                                        <p className="text-xs text-destructive font-medium">
                                            Passwords do not match
                                        </p>
                                    )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner className="w-4 h-4 mr-2" />
                                        Creating account…
                                    </>
                                ) : (
                                    "Create account"
                                )}
                            </Button>
                        </form>
                    </Card>

                    {/* Footer links */}
                    <div className="flex flex-col items-center gap-3 pt-2">
                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-semibold text-primary hover:opacity-80 transition-opacity"
                            >
                                Sign in
                            </Link>
                        </p>

                        <Link to="/">
                            <Button
                                variant="link"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground text-xs h-8 gap-1"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Back to home
                            </Button>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    )
}