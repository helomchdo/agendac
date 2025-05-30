
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full", // Ensure month takes full width
        caption: "flex justify-center pt-1 relative items-center h-10", // Added height for caption
        caption_label: "text-sm font-semibold", // Adjusted font weight
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1", // Ensure table takes full width
        head_row: "flex w-full", // Ensure head_row takes full width
        head_cell:
          "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] justify-center flex", // Make head cells take full available width and center text
        row: "flex w-full mt-2",
        cell: cn( // Cell takes full width, flex for centering content
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1", // flex-1 to distribute space
          "[&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
          "[&:has([aria-selected].day-outside)]:bg-accent/50",
          "[&:has([aria-selected].day-range-end)]:rounded-r-full",
           // Ensure hover applies to the full cell area for better UX
          "hover:bg-accent/30 rounded-full transition-colors duration-100" 
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full mx-auto" // Make day button circular and center it
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames, 
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
      }}
      weekStartsOn={1} // Start week on Monday
      fixedWeeks // Ensure 6 weeks are always rendered for consistent height
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }


