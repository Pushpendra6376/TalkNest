import React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/* ───────────────── Root ───────────────── */
export function AlertDialog(props) {
  return <AlertDialogPrimitive.Root {...props} />
}

/* ───────────────── Trigger ───────────────── */
export function AlertDialogTrigger(props) {
  return <AlertDialogPrimitive.Trigger {...props} />
}

/* ───────────────── Portal ───────────────── */
export function AlertDialogPortal(props) {
  return <AlertDialogPrimitive.Portal {...props} />
}

/* ───────────────── Overlay ───────────────── */
export function AlertDialogOverlay({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Content ───────────────── */
export function AlertDialogContent({ className, size = "default", ...props }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-size={size}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
          "grid gap-5 rounded-xl bg-background p-6 shadow-xl",
          "outline-none",
          "max-w-[90%] sm:max-w-lg",
          "data-[state=open]:animate-in data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:zoom-out-95",
          size === "sm" && "sm:max-w-sm",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

/* ───────────────── Header ───────────────── */
export function AlertDialogHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center gap-2 sm:items-start sm:text-left",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Footer ───────────────── */
export function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Media (Icon/Image) ───────────────── */
export function AlertDialogMedia({ className, ...props }) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center justify-center",
        "size-14 rounded-lg bg-muted",
        "[&_svg]:size-6",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Title ───────────────── */
export function AlertDialogTitle({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

/* ───────────────── Description ───────────────── */
export function AlertDialogDescription({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Description
      className={cn(
        "text-sm text-muted-foreground leading-relaxed",
        "[&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Actions ───────────────── */
export function AlertDialogAction({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <Button asChild variant={variant} size={size}>
      <AlertDialogPrimitive.Action className={cn(className)} {...props} />
    </Button>
  )
}

export function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}) {
  return (
    <Button asChild variant={variant} size={size}>
      <AlertDialogPrimitive.Cancel className={cn(className)} {...props} />
    </Button>
  )
}