import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="relative w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-pintu1-text-secondary)] dark:text-[var(--color-pintu1-text-secondary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full border-b-2 bg-transparent px-0 py-2 text-base text-[var(--color-pintu1-text-primary)] dark:text-[var(--color-pintu1-text-light)] placeholder:text-[var(--color-pintu1-text-tertiary)] dark:placeholder:text-[var(--color-pintu1-text-secondary)]",
            "border-[var(--color-pintu1-border)] dark:border-[var(--color-pintu1-border)]",
            "focus:border-[var(--color-pintu1-gold)] dark:focus:border-[var(--color-pintu1-gold-light)] focus:outline-none focus:ring-0",
            "transition-colors duration-200",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--color-semantic-error)] dark:border-[var(--color-semantic-error)]",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-xs text-[var(--color-semantic-error)] dark:text-[var(--color-semantic-error)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${className || ''}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"
export { Textarea }