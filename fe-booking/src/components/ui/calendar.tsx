import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 sm:p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3 sm:space-y-4",
        caption: "flex justify-center pt-1 relative items-center px-8 sm:px-10",
        caption_label: "text-base sm:text-lg font-semibold",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 sm:h-9 sm:w-9 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent",
        ),
        nav_button_previous: "absolute left-0 sm:left-1",
        nav_button_next: "absolute right-0 sm:right-1",
        table: "w-full border-collapse",
        head_row: "flex justify-between",
        head_cell: cn(
          "text-muted-foreground rounded-md font-medium text-xs sm:text-sm",
          "w-10 h-8 sm:w-11 sm:h-9 flex items-center justify-center"
        ),
        row: "flex w-full justify-between mt-1 sm:mt-2",
        cell: cn(
          "relative text-center text-sm p-0.5",
          "h-10 w-10 sm:h-11 sm:w-11",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-primary/10 [&:has([aria-selected])]:rounded-lg",
          "[&:has([aria-selected].day-outside)]:bg-accent/50",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 sm:h-10 sm:w-10 p-0 font-normal text-sm sm:text-base",
          "aria-selected:opacity-100 rounded-lg",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground",
          "transition-colors duration-200"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground font-semibold",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "shadow-sm"
        ),
        day_today: cn(
          "bg-accent/30 text-accent-foreground font-semibold",
          "ring-2 ring-primary/30"
        ),
        day_outside: cn(
          "day-outside text-muted-foreground/50",
          "aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        ),
        day_disabled: "text-muted-foreground/40 cursor-not-allowed hover:bg-transparent",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-5 w-5" />,
        IconRight: () => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
