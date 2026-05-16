import * as React from "react"
import { cva } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "bg-transparent text-foreground hover:bg-muted/80",
        outline: "border border-border bg-background hover:bg-muted",
        subtle: "bg-muted text-foreground hover:bg-muted/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-6 rounded-md",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*:focus-visible]:relative [&>*:focus-visible]:z-10 [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function ButtonGroup({ className, orientation = "horizontal", ...props }) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

function ButtonGroupText({ className, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="button-group-text"
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted px-2.5 py-1 text-sm font-medium shadow-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "bg-border shrink-0",
        orientation === "horizontal"
          ? "h-px w-full my-1"
          : "w-px h-auto mx-1",
        className
      )}
      {...props}
    />
  )
}

export {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonVariants,
  buttonGroupVariants,
}