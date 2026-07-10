"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  showClose?: boolean
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  showClose = true,
}: ModalProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-[var(--color-pintu1-border)] bg-white dark:bg-[var(--color-pintu1-primary)] p-6 shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-300",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Close Button */}
        {showClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-pintu1-text-tertiary)] hover:bg-[var(--color-pintu1-primary-wash)] hover:text-[var(--color-pintu1-text-primary)] transition-colors"
            aria-label="Tutup"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Header */}
        {title && (
          <div className="mb-4">
            <h2
              id="modal-title"
              className="font-[var(--font-heading)] text-2xl font-semibold text-[var(--color-pintu1-text-primary)] dark:text-[var(--color-pintu1-text-light)]"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--color-pintu1-text-secondary)] dark:text-[var(--color-pintu1-text-secondary)]">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Body */}
        {children}
      </div>
    </div>
  )
}

export { Modal }