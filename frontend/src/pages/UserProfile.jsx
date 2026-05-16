import { useState, useRef } from "react"
import {
    Camera,
    Pencil,
    Check,
    X,
    Eye,
    EyeOff,
    Loader2,
    Trash2,
    Sun,
    Moon,
    Monitor,
} from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"
import { userApi } from "@/lib/api"
import { useTheme } from "@/components/theme-provider"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

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

/* ───────────────────────────────────────────────────────────── */
/* localStorage keys */
/* ───────────────────────────────────────────────────────────── */

export const LS_NOTIF_BANNERS = "notif-banners-enabled"
export const LS_NOTIF_SOUND = "notif-sound-enabled"

const getStoredBool = (key, fallback = true) => {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === "true"
}

/* ───────────────────────────────────────────────────────────── */
/* Editable Field */
/* ───────────────────────────────────────────────────────────── */

function EditableField({
    label,
    value,
    onSave,
    multiline = false,
}) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (draft.trim() === value) {
            setEditing(false)
            return
        }

        setSaving(true)

        try {
            await onSave(draft.trim())
            setEditing(false)
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setDraft(value)
        setEditing(false)
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    {label}
                </Label>

                {!editing && (
                    <button
                        onClick={() => {
                            setDraft(value)
                            setEditing(true)
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Pencil className="size-3.5" />
                    </button>
                )}
            </div>

            {editing ? (
                <div className="flex gap-2 items-start">
                    {multiline ? (
                        <textarea
                            autoFocus
                            rows={3}
                            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                        />
                    ) : (
                        <Input
                            autoFocus
                            className="flex-1"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave()
                                if (e.key === "Escape") handleCancel()
                            }}
                        />
                    )}

                    <div className="flex gap-1">
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="rounded-md p-1.5 bg-muted text-muted-foreground hover:bg-muted/80"
                        >
                            <X className="size-3.5" />
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-md p-1.5 text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Check className="size-3.5" />
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-sm whitespace-pre-wrap break-words">
                    {value || (
                        <span className="text-muted-foreground italic">
                            Not set
                        </span>
                    )}
                </p>
            )}
        </div>
    )
}

/* ───────────────────────────────────────────────────────────── */
/* Password Input */
/* ───────────────────────────────────────────────────────────── */

function PasswordInput({
    id,
    label,
    value,
    onChange,
    placeholder,
}) {
    const [show, setShow] = useState(false)

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>

            <div className="relative">
                <Input
                    id={id}
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pr-10"
                />

                <button
                    type="button"
                    onClick={() => setShow((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    {show ? (
                        <EyeOff className="size-4" />
                    ) : (
                        <Eye className="size-4" />
                    )}
                </button>
            </div>
        </div>
    )
}

/* ───────────────────────────────────────────────────────────── */
/* Main Component */
/* ───────────────────────────────────────────────────────────── */

const UserProfile = () => {
    const { user, setUser, logout } = useAuth()
    const { theme, setTheme } = useTheme()

    const navigate = useNavigate()

    const fileInputRef = useRef(null)

    const [avatarUploading, setAvatarUploading] = useState(false)

    /* password */
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirm] = useState("")
    const [pwSaving, setPwSaving] = useState(false)

    /* notifications */
    const [bannersEnabled, setBannersEnabled] = useState(() =>
        getStoredBool(LS_NOTIF_BANNERS)
    )

    const [soundEnabled, setSoundEnabled] = useState(() =>
        getStoredBool(LS_NOTIF_SOUND)
    )

    const [emailNotifsEnabled, setEmailNotifsEnabled] = useState(
        user?.emailNotificationsEnabled ?? true
    )

    const [emailNotifsLoading, setEmailNotifsLoading] = useState(false)

    /* delete dialog */
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const [deleting, setDeleting] = useState(false)

    if (!user) return null

    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?"

    const hasCustomPhoto =
        user.profilePic &&
        !user.profilePic.includes("ui-avatars.com")

    /* ───────────────────────────────────────────────────────── */

    const handleRemoveAvatar = async () => {
        const defaultUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name
        )}&background=random&bold=true`

        setAvatarUploading(true)

        try {
            await userApi.updateProfile({
                profilePic: defaultUrl,
            })

            setUser({
                ...user,
                profilePic: defaultUrl,
            })

            toast.success("Profile photo removed")
        } catch (e) {
            toast.error(
                e instanceof Error
                    ? e.message
                    : "Failed to remove photo"
            )
        } finally {
            setAvatarUploading(false)
        }
    }

    /* ───────────────────────────────────────────────────────── */

    const handleAvatarChange = async (file) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        setAvatarUploading(true)

        try {
            const { url, fields } =
                await userApi.getPresignedUrl(
                    file.name,
                    file.type
                )

            const form = new FormData()

            Object.entries(fields).forEach(([k, v]) => {
                form.append(k, v)
            })

            form.append("file", file)

            const upload = await fetch(url, {
                method: "POST",
                body: form,
            })

            if (!upload.ok) {
                throw new Error("Upload failed")
            }

            const xml = await upload.text()

            const loc = xml.match(
                /<Location>(.*?)<\/Location>/
            )?.[1]

            if (!loc) {
                throw new Error(
                    "Could not parse upload location"
                )
            }

            const imageUrl = decodeURIComponent(loc)

            await userApi.updateProfile({
                profilePic: imageUrl,
            })

            setUser({
                ...user,
                profilePic: imageUrl,
            })

            toast.success("Profile photo updated")
        } catch (e) {
            toast.error(
                e instanceof Error
                    ? e.message
                    : "Upload failed"
            )
        } finally {
            setAvatarUploading(false)
        }
    }

    /* ───────────────────────────────────────────────────────── */

    const handleSaveName = async (name) => {
        await userApi.updateProfile({ name })

        setUser({
            ...user,
            name,
        })

        toast.success("Name updated")
    }

    const handleSaveAbout = async (about) => {
        await userApi.updateProfile({ about })

        setUser({
            ...user,
            about,
        })

        toast.success("About updated")
    }

    /* ───────────────────────────────────────────────────────── */

    const handlePasswordChange = async (e) => {
        e.preventDefault()

        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill all password fields")
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match")
            return
        }

        if (newPassword.length < 6) {
            toast.error(
                "Password must be at least 6 characters"
            )
            return
        }

        setPwSaving(true)

        try {
            await userApi.updateProfile({
                oldpassword: oldPassword,
                newpassword: newPassword,
            })

            toast.success(
                "Password changed successfully"
            )

            setOldPassword("")
            setNewPassword("")
            setConfirm("")
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to change password"
            )
        } finally {
            setPwSaving(false)
        }
    }

    /* ───────────────────────────────────────────────────────── */

    const toggleBanners = (val) => {
        setBannersEnabled(val)

        localStorage.setItem(
            LS_NOTIF_BANNERS,
            String(val)
        )
    }

    const toggleSound = (val) => {
        setSoundEnabled(val)

        localStorage.setItem(
            LS_NOTIF_SOUND,
            String(val)
        )
    }

    const toggleEmailNotifs = async (val) => {
        setEmailNotifsEnabled(val)
        setEmailNotifsLoading(true)

        try {
            await userApi.updateProfile({
                emailNotificationsEnabled: val,
            })

            setUser({
                ...user,
                emailNotificationsEnabled: val,
            })
        } catch (err) {
            setEmailNotifsEnabled(!val)

            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to update email notifications"
            )
        } finally {
            setEmailNotifsLoading(false)
        }
    }

    /* ───────────────────────────────────────────────────────── */

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    /* ───────────────────────────────────────────────────────── */

    const handleDeleteAccount = async () => {
        setDeleting(true)

        try {
            await userApi.deleteAccount()

            toast.success("Account deleted")

            logout()

            navigate("/login")
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to delete account"
            )
        } finally {
            setDeleting(false)
            setDeleteDialogOpen(false)
        }
    }

    /* ───────────────────────────────────────────────────────── */

    return (
        <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-xl mx-auto space-y-6">

                    {/* Profile */}

                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>

                            <CardDescription>
                                Your public information
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">

                            {/* Avatar */}

                            <div className="flex justify-center">
                                <div className="relative group">

                                    <Avatar className="size-24 text-lg">
                                        <AvatarImage
                                            src={user.profilePic}
                                            alt={user.name}
                                        />

                                        <AvatarFallback className="bg-primary/20 font-semibold text-xl">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {avatarUploading ? (
                                            <Loader2 className="size-6 text-white animate-spin" />
                                        ) : (
                                            <div className="flex gap-2">

                                                <button
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                    disabled={avatarUploading}
                                                    className="p-1 hover:scale-110 transition-transform"
                                                    title="Upload photo"
                                                >
                                                    <Camera className="size-5 text-white" />
                                                </button>

                                                {hasCustomPhoto && (
                                                    <button
                                                        onClick={handleRemoveAvatar}
                                                        disabled={avatarUploading}
                                                        className="p-1 hover:scale-110 transition-transform"
                                                        title="Remove photo"
                                                    >
                                                        <Trash2 className="size-5 text-white" />
                                                    </button>
                                                )}

                                            </div>
                                        )}
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f =
                                                e.target.files?.[0]

                                            if (f) {
                                                handleAvatarChange(f)
                                            }

                                            e.target.value = ""
                                        }}
                                    />

                                </div>
                            </div>

                            <Separator />

                            <EditableField
                                label="Name"
                                value={user.name}
                                onSave={handleSaveName}
                            />

                            <EditableField
                                label="About"
                                value={user.about ?? ""}
                                onSave={handleSaveAbout}
                                multiline
                            />

                        </CardContent>
                    </Card>

                    {/* Change Password */}

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Change Password
                            </CardTitle>

                            <CardDescription>
                                Update your account password
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form
                                onSubmit={handlePasswordChange}
                                className="space-y-4"
                            >

                                <PasswordInput
                                    id="old-pw"
                                    label="Current Password"
                                    value={oldPassword}
                                    onChange={setOldPassword}
                                    placeholder="Enter current password"
                                />

                                <PasswordInput
                                    id="new-pw"
                                    label="New Password"
                                    value={newPassword}
                                    onChange={setNewPassword}
                                    placeholder="Enter new password"
                                />

                                <PasswordInput
                                    id="confirm-pw"
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={setConfirm}
                                    placeholder="Confirm new password"
                                />

                                <Button
                                    type="submit"
                                    disabled={pwSaving}
                                    className="w-full"
                                >
                                    {pwSaving ? (
                                        <>
                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        "Change Password"
                                    )}
                                </Button>

                            </form>
                        </CardContent>
                    </Card>

                    {/* Appearance */}

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Appearance
                            </CardTitle>

                            <CardDescription>
                                Choose your preferred color theme.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-3 gap-3">

                                {[
                                    {
                                        value: "light",
                                        label: "Light",
                                        Icon: Sun,
                                    },
                                    {
                                        value: "dark",
                                        label: "Dark",
                                        Icon: Moon,
                                    },
                                    {
                                        value: "system",
                                        label: "System",
                                        Icon: Monitor,
                                    },
                                ].map(({ value, label, Icon }) => (

                                    <button
                                        key={value}
                                        onClick={() =>
                                            setTheme(value)
                                        }
                                        className={[
                                            "flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 text-sm font-medium transition-colors",
                                            theme === value
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                                        ].join(" ")}
                                    >
                                        <Icon className="size-5" />
                                        {label}
                                    </button>

                                ))}

                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Notification Settings
                            </CardTitle>

                            <CardDescription>
                                Control how you receive notifications
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="notif-banners"
                                        className="text-sm font-medium"
                                    >
                                        Notification Banners
                                    </Label>

                                    <p className="text-xs text-muted-foreground">
                                        Show toast notifications
                                        for new messages
                                    </p>
                                </div>

                                <Switch
                                    id="notif-banners"
                                    checked={bannersEnabled}
                                    onCheckedChange={toggleBanners}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="notif-sound"
                                        className="text-sm font-medium"
                                    >
                                        Notification Sound
                                    </Label>

                                    <p className="text-xs text-muted-foreground">
                                        Play a sound when a new
                                        message arrives
                                    </p>
                                </div>

                                <Switch
                                    id="notif-sound"
                                    checked={soundEnabled}
                                    onCheckedChange={toggleSound}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="notif-email"
                                        className="text-sm font-medium"
                                    >
                                        Email Notifications
                                    </Label>

                                    <p className="text-xs text-muted-foreground">
                                        Receive an email when you
                                        are offline
                                    </p>
                                </div>

                                <Switch
                                    id="notif-email"
                                    checked={emailNotifsEnabled}
                                    disabled={emailNotifsLoading}
                                    onCheckedChange={
                                        toggleEmailNotifs
                                    }
                                />
                            </div>

                        </CardContent>
                    </Card>

                    {/* Account */}

                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>

                            <CardDescription>
                                Manage your session and account
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">

                            <Button
                                variant="outline"
                                className="w-full justify-center gap-2"
                                onClick={handleLogout}
                            >
                                Log Out
                            </Button>

                            <Button
                                variant="destructive"
                                className="w-full justify-center gap-2"
                                onClick={() => {
                                    setDeleteConfirmText("")
                                    setDeleteDialogOpen(true)
                                }}
                            >
                                Delete My Account
                            </Button>

                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Delete Dialog */}

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>

                    <AlertDialogHeader>

                        <AlertDialogTitle>
                            Delete account?
                        </AlertDialogTitle>

                        <AlertDialogDescription asChild>
                            <div className="space-y-3">

                                <p>
                                    This action cannot be undone.
                                </p>

                                <p>
                                    Type <strong>DELETE</strong>
                                    {" "}below to confirm:
                                </p>

                                <Input
                                    value={deleteConfirmText}
                                    onChange={(e) =>
                                        setDeleteConfirmText(
                                            e.target.value
                                        )
                                    }
                                    placeholder="DELETE"
                                    className="font-mono"
                                />

                            </div>
                        </AlertDialogDescription>

                    </AlertDialogHeader>

                    <AlertDialogFooter>

                        <AlertDialogCancel disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            disabled={
                                deleteConfirmText !== "DELETE" ||
                                deleting
                            }
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Deleting…
                                </>
                            ) : (
                                "Delete Account"
                            )}
                        </AlertDialogAction>

                    </AlertDialogFooter>

                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default UserProfile