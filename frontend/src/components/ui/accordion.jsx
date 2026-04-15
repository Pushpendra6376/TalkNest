import React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/* ───────────────── Root ───────────────── */
export function Accordion({ className, ...props }) {
  return (
    <AccordionPrimitive.Root
      className={cn("w-full flex flex-col", className)}
      {...props}
    />
  )
}

/* ───────────────── Item ───────────────── */
export function AccordionItem({ className, ...props }) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b last:border-none", className)}
      {...props}
    />
  )
}

/* ───────────────── Trigger ───────────────── */
export function AccordionTrigger({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex w-full items-center justify-between py-4 text-sm font-medium transition-all",
          "hover:underline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        {children}

        {/* Single icon with rotate animation (cleaner UX) */}
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

/* ───────────────── Content ───────────────── */
export function AccordionContent({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden text-sm",
        "data-[state=open]:animate-accordion-down",
        "data-[state=closed]:animate-accordion-up"
      )}
      {...props}
    >
      <div
        className={cn(
          "pt-0 pb-4",
          "[&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-foreground",
          "[&_p:not(:last-child)]:mb-3",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}