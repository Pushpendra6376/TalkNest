import React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

/* ───────────────── Avatar Root ───────────────── */
export function Avatar({ className, size = "default", ...props }) {
  const sizeClasses =
    size === "sm"
      ? "size-6"
      : size === "lg"
      ? "size-10"
      : "size-8"

  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 rounded-full overflow-hidden",
        "border border-border",
        sizeClasses,
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Image ───────────────── */
export function AvatarImage({ className, ...props }) {
  return (
    <AvatarPrimitive.Image
      className={cn(
        "h-full w-full object-cover",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Fallback ───────────────── */
export function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex items-center justify-center h-full w-full",
        "bg-muted text-muted-foreground text-sm font-medium",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Badge (Online / Status) ───────────────── */
export function AvatarBadge({ className, ...props }) {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0",
        "size-2.5 rounded-full bg-primary",
        "ring-2 ring-background",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Group ───────────────── */
export function AvatarGroup({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex -space-x-2",
        "[&>*]:ring-2 [&>*]:ring-background",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Group Count (+3 etc) ───────────────── */
export function AvatarGroupCount({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "size-8 rounded-full bg-muted text-muted-foreground text-sm font-medium",
        "ring-2 ring-background",
        className
      )}
      {...props}
    />
  )
}