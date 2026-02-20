import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeroProps {
  title: string
  subtitle?: string
  breadcrumbs: BreadcrumbItem[]
  containerClassName?: string
  contentClassName?: string
}

export function PageHero({
  title,
  subtitle,
  breadcrumbs,
  containerClassName = "pb-12",
  contentClassName = "pt-32 pb-10 md:pt-36 md:pb-14",
}: PageHeroProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-[#141414] pt-0",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:bg-[radial-gradient(120%_70%_at_50%_0%,rgba(255,255,255,0.14),rgba(255,255,255,0)_58%)]",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-24",
        "after:bg-gradient-to-b after:from-transparent after:to-white/8",
        containerClassName
      )}
    >
      <Navbar />
      <div className={cn("relative z-10 px-6 text-center", contentClassName)}>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">{title}</h1>
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-lg">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-300 backdrop-blur-sm">
          {breadcrumbs.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href ? (
                <Link href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-white">{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 ? <span className="text-gray-500">/</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
