import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base styles
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Default: Primary gold
        default:
          "border-transparent bg-primary text-primary-foreground",
        // Secondary: Muted
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        // Outline: Bordered
        outline:
          "border-border bg-transparent text-foreground",
        // Success: Green semantic
        success:
          "border-success-border bg-success-bg text-success-text",
        // Warning: Amber semantic
        warning:
          "border-warning-border bg-warning-bg text-warning-text",
        // Destructive: Red semantic
        destructive:
          "border-danger-border bg-danger-bg text-danger-text",
        // Accent: Blue tech
        accent:
          "border-accent/30 bg-accent/10 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
