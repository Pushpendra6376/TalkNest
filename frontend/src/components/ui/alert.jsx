import React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ───────────────── Variants ───────────────── */
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm flex gap-3",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "bg-card text-destructive border-destructive/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/* ───────────────── Alert ───────────────── */
export function Alert({ className, variant = "default", ...props }) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

/* ───────────────── Title ───────────────── */
export function AlertTitle({ className, ...props }) {
  return (
    <div
      className={cn(
        "font-medium leading-none",
        "[&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Description ───────────────── */
export function AlertDescription({ className, ...props }) {
  return (
    <div
      className={cn(
        "text-sm text-muted-foreground leading-relaxed",
        "[&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-foreground",
        "[&_p:not(:last-child)]:mb-2",
        className
      )}
      {...props}
    />
  )
}

/* ───────────────── Action (Top Right Button) ───────────────── */
export function AlertAction({ className, ...props }) {
  return (
    <div
      className={cn("absolute top-2 right-3", className)}
      {...props}
    />
  )
}