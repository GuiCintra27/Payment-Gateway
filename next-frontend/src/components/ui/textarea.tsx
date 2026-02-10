import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles (consistent with Input)
          "flex min-h-[120px] w-full rounded-md border bg-background-subtle px-3 py-2 text-sm text-foreground transition-all duration-150 ease-out resize-none",
          // Border
          "border-border hover:border-white/12",
          // Placeholder
          "placeholder:text-muted-foreground/60",
          // Focus state with glow
          "focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-glow",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border",
          // Invalid state
          "aria-invalid:border-destructive aria-invalid:focus:ring-destructive/20",
          // Selection
          "selection:bg-primary selection:text-primary-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
