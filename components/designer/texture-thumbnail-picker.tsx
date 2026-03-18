"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

export interface TextureOption {
  value: string
  label: string
  /** Image URL for the thumbnail preview. Falls back to a solid colour swatch. */
  previewUrl?: string
  /** Solid colour shown when previewUrl is absent or fails to load */
  solidColor?: string
  category?: string
}

interface Props {
  options: TextureOption[]
  value: string
  onChange: (value: string) => void
  /** Thumbnail circle size in px. Defaults to 36. */
  thumbSize?: number
  placeholder?: string
  className?: string
}

/** Round thumbnail for a single texture option. */
function TextureThumb({
  option,
  size = 36,
}: {
  option: TextureOption
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const showImg = !!option.previewUrl && !failed

  return (
    <span
      className="inline-flex shrink-0 overflow-hidden rounded-full border border-border"
      style={{ width: size, height: size }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={option.previewUrl}
          alt={option.label}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="h-full w-full"
          style={{ backgroundColor: option.solidColor ?? "#e5e7eb" }}
        />
      )}
    </span>
  )
}

/**
 * Custom dropdown that shows a round thumbnail + label per row.
 * Replaces the previous grid-of-circles approach.
 */
export function TextureThumbnailPicker({
  options,
  value,
  onChange,
  thumbSize = 36,
  placeholder = "Select texture…",
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm transition-all",
          "hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "border-primary ring-2 ring-primary/30"
        )}
      >
        {selected ? (
          <>
            <TextureThumb option={selected} size={thumbSize} />
            <span className="flex-1 text-left font-medium text-foreground">
              {selected.label}
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-lg",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          <ul
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                >
                  <TextureThumb option={opt} size={thumbSize} />
                  <span className="flex-1">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
