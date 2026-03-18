"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export interface TextureOption {
  value: string
  label: string
  /** Image URL for the thumbnail preview. If omitted a color swatch is shown. */
  previewUrl?: string
  /** Fallback solid color used when previewUrl is absent or fails to load */
  solidColor?: string
  category?: string
}

interface TextureThumbnailPickerProps {
  options: TextureOption[]
  value: string
  onChange: (value: string) => void
  /** Size of each round thumbnail in px. Defaults to 48. */
  size?: number
  className?: string
}

/**
 * Displays a horizontally-wrapping grid of round thumbnail buttons.
 * Clicking a thumbnail selects that texture value.
 */
export function TextureThumbnailPicker({
  options,
  value,
  onChange,
  size = 48,
  className,
}: TextureThumbnailPickerProps) {
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(new Set())

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const isSelected = opt.value === value
        const hasFailed = opt.previewUrl ? failedSrcs.has(opt.previewUrl) : true
        const showImage = !!opt.previewUrl && !hasFailed

        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            aria-label={`Select texture: ${opt.label}`}
            aria-pressed={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isSelected
                ? "border-primary shadow-md ring-2 ring-primary ring-offset-1 scale-110"
                : "border-border hover:border-primary/60 hover:scale-105"
            )}
            style={{ width: size, height: size }}
          >
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={opt.previewUrl}
                alt={opt.label}
                className="h-full w-full object-cover"
                onError={() =>
                  setFailedSrcs((prev) => {
                    const next = new Set(prev)
                    next.add(opt.previewUrl!)
                    return next
                  })
                }
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-[9px] font-semibold leading-tight text-center px-0.5 text-foreground/70"
                style={{ backgroundColor: opt.solidColor ?? "#e5e7eb" }}
              >
                {opt.label.length > 6 ? opt.label.slice(0, 5) + "…" : opt.label}
              </span>
            )}

            {/* Selected tick overlay */}
            {isSelected && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-primary/20">
                <svg
                  className="h-4 w-4 text-primary drop-shadow"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
