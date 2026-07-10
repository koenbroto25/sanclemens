import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success:
          "bg-[var(--color-semantic-success-wash)] text-[var(--color-semantic-success)] border border-[var(--color-semantic-success)]/20 dark:bg-[var(--color-semantic-success)]/20 dark:text-[var(--color-semantic-success)]",
        warning:
          "bg-[var(--color-semantic-warning-wash)] text-[var(--color-semantic-warning)] border border-[var(--color-semantic-warning)]/20 dark:bg-[var(--color-semantic-warning)]/20 dark:text-[var(--color-semantic-warning)]",
        error:
          "bg-[var(--color-semantic-error-wash)] text-[var(--color-semantic-error)] border border-[var(--color-semantic-error)]/20 dark:bg-[var(--color-semantic-error)]/20 dark:text-[var(--color-semantic-error)]",
        info:
          "bg-[var(--color-semantic-info-wash)] text-[var(--color-semantic-info)] border border-[var(--color-semantic-info)]/20 dark:bg-[var(--color-semantic-info)]/20 dark:text-[var(--color-semantic-info)]",
        liturgi:
          "bg-[var(--color-liturgi-hijau)]/10 text-[var(--color-liturgi-hijau)] border border-[var(--color-liturgi-hijau)]/20 dark:bg-[var(--color-liturgi-hijau)]/20 dark:text-[var(--color-liturgi-hijau)]",
        gold:
          "bg-[var(--color-pintu1-gold-wash)] text-[var(--color-pintu1-gold)] border border-[var(--color-pintu1-gold)]/20 dark:bg-[var(--color-pintu1-gold)]/20 dark:text-[var(--color-pintu1-gold-light)]",
      },
    },
    defaultVariants: {
      variant: "info",
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