import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer select-none",
  {
    variants: {
      variant: {
        // Primary: Gold/Champagne with glow on hover
        default:
          "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(0,0,0,0.45)] hover:bg-primary-hover hover:shadow-[0_10px_24px_rgba(0,0,0,0.55)] active:shadow-[0_6px_16px_rgba(0,0,0,0.45)]",
        // Destructive: Red with subtle glow
        destructive:
          "bg-destructive text-white shadow-md hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(248,113,113,0.15)] focus-visible:ring-destructive/50",
        // Outline: Metallic border
        outline:
          "border border-primary/35 bg-transparent text-primary shadow-sm hover:bg-primary/8 hover:border-primary/60 hover:shadow-md",
        // Secondary: Muted background
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md",
        // Ghost: Minimal, subtle hover
        ghost:
          "text-muted-foreground hover:bg-white/4 hover:text-foreground",
        // Link: Text only with underline
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
        // Accent: Sky blue variant
        accent:
          "bg-accent text-accent-foreground shadow-[0_6px_16px_rgba(0,0,0,0.4)] hover:bg-accent-muted hover:shadow-[0_10px_24px_rgba(0,0,0,0.5)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
