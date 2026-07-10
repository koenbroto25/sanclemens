"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useAuthStore, type HomepageContext } from "@/stores/auth.store"
interface RoleContextBadgeProps {
  className?: string
}
const contextConfig: Record<HomepageContext, {
  label: string
  className: string
}> = {
  paroki: {
    label: "Paroki",
    className: "bg-[var(--color-pintu1-gold)]/15 text-[var(--color-pintu1-gold)] border-[var(--color-pintu1-gold)]/30",
  },
  lingkungan: {
    label: "Lingkungan",
    className: "bg-[var(--color-pintu2-gold)]/15 text-[var(--color-pintu2-primary)] border-[var(--color-pintu2-gold)]/30",
  },
  marketplace: {
    label: "Pasar Kasih",
    className: "bg-[var(--color-pintu3-primary)]/15 text-[var(--color-pintu3-primary)] border-[var(--color-pintu3-accent)]/30",
  },
  "gate-hub": {
    label: "Gate Hub",
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
}
export function RoleContextBadge({ className }: RoleContextBadgeProps) {
  const homepageContext = useAuthStore((s) => s.homepageContext)
  const config = contextConfig[homepageContext]
  if (!config) return null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-medium uppercase tracking-wider",
        "transition-all duration-300",
        config.className,
        className
      )}
      aria-label={`Konteks aktif: ${config.label}`}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}