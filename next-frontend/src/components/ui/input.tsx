import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-md border bg-background-subtle px-3 py-2 text-sm text-foreground transition-all duration-150 ease-out",
          // Border
          "border-border hover:border-white/12",
          // Placeholder
          "placeholder:text-muted-foreground/60",
          // Focus state with glow
          "focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-glow",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
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
Input.displayName = "Input"

export { Input }
