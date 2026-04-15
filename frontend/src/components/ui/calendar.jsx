"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-3",
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col gap-4 md:flex-row"),
        month: cn("flex flex-col gap-4"),
        nav: cn("flex items-center justify-between"),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0"
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0"
        ),
        month_caption: "flex justify-center text-sm font-medium",
        weekdays: "flex",
        weekday:
          "flex-1 text-center text-xs text-muted-foreground",
        week: "flex w-full",
        day: "flex-1 flex justify-center",
        today: "bg-muted",
        selected: "bg-primary text-white",
        ...classNames,
      }}
      components={{
        Root: ({ className, ...props }) => (
          <div
            data-slot="calendar"
            className={cn(className)}
            {...props}
          />
        ),

        Chevron: ({ orientation, ...props }) => {
          if (orientation === "left")
            return <ChevronLeftIcon className="size-4" {...props} />
          if (orientation === "right")
            return <ChevronRightIcon className="size-4" {...props} />

          return <ChevronDownIcon className="size-4" {...props} />
        },

        DayButton: (props) => (
          <CalendarDayButton locale={locale} {...props} />
        ),

        ...components,
      }}
      {...props}
    />
  )
}

/* ✅ Simplified + optimized */
function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}) {
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (modifiers?.focused) {
      ref.current?.focus()
    }
  }, [modifiers?.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day?.date?.toLocaleDateString?.(locale?.code)}
      className={cn(
        "h-9 w-9 p-0 font-normal",
        modifiers?.selected &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        modifiers?.today && "bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }