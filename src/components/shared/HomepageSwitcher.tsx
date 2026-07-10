"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore, selectIsLoggedIn, selectCanAccessPintu2, type HomepageContext } from "@/stores/auth.store"

interface HomepageOption {
  id: HomepageContext
  icon: string
  label: string
  tooltipDisabled?: string
}

const homepageOptions: HomepageOption[] = [
  { id: "paroki", icon: "🛕", label: "Paroki" },
  { id: "lingkungan", icon: "🏘️", label: "Lingkungan", tooltipDisabled: "Masuk terlebih dahulu" },
  { id: "marketplace", icon: "🛒", label: "Pasar Kasih", tooltipDisabled: "Segera hadir · Fase 4" },
]

interface HomepageSwitcherProps {
  className?: string
}

export function HomepageSwitcher({ className }: HomepageSwitcherProps) {
  const router = useRouter()
  const homepageContext = useAuthStore((s) => s.homepageContext)
  const setHomepageContext = useAuthStore((s) => s.setHomepageContext)
  const user = useAuthStore((s) => s.user)

  const isLoggedIn = user !== null && user.status === "active"
  const hasLingkungan = user?.lingkungan_id != null
  const isMarketplaceEnabled = process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE === "true"

  const getDisabled = (option: HomepageOption): boolean => {
    if (option.id === "paroki") return false
    if (option.id === "lingkungan") return !isLoggedIn || !hasLingkungan
    if (option.id === "marketplace") return !isLoggedIn || !isMarketplaceEnabled
    return false
  }

  const handleSwitch = (option: HomepageOption) => {
    if (getDisabled(option)) return

    setHomepageContext(option.id)

    switch (option.id) {
      case "paroki":
        router.push("/")
        break
      case "lingkungan":
        if (user?.lingkungan_slug) {
          router.push(`/lingkungan/${user.lingkungan_slug}`)
        }
        break
      case "marketplace":
        if (typeof window !== "undefined") {
          window.location.href = process.env.NEXT_PUBLIC_APP2_URL || "https://ekonomi.paroki-santo-klemens.org"
        }
        break
    }
  }

  const getActiveHighlight = () => {
    switch (homepageContext) {
      case "lingkungan":
        return "border-[var(--color-pintu2-gold)] bg-[var(--color-pintu2-gold)]/10"
      case "marketplace":
        return "border-[var(--color-pintu3-accent)] bg-[var(--color-pintu3-accent)]/10"
      default:
        return "border-[var(--color-pintu1-gold)] bg-[var(--color-pintu1-gold-wash)]"
    }
  }

  return (
    <nav
      className={cn(
        "flex items-center gap-1 rounded-full border px-1 py-1",
        "border-[rgba(200,169,110,0.15)]",
        "bg-[rgba(200,169,110,0.08)]",
        "backdrop-blur-sm",
        className
      )}
      role="navigation"
      aria-label="Pilih halaman utama"
    >
      {homepageOptions.map((option) => {
        const disabled = getDisabled(option)
        const isActive = homepageContext === option.id

        return (
          <button
            key={option.id}
            onClick={() => handleSwitch(option)}
            disabled={disabled}
            title={disabled ? option.tooltipDisabled : option.label}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-200",
              isActive && !disabled && [
                "border",
                getActiveHighlight(),
                "shadow-sm",
              ],
              !isActive && !disabled && "hover:bg-[rgba(200,169,110,0.12)]",
              disabled && "opacity-35 cursor-not-allowed",
              isActive
                ? "text-[var(--color-pintu1-text-primary)] dark:text-[var(--color-pintu1-text-light)]"
                : "text-[var(--color-pintu1-text-secondary)] dark:text-[var(--color-pintu1-text-secondary)]"
            )}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {option.icon}
            </span>
            <span className="hidden sm:inline text-xs font-medium">
              {option.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}