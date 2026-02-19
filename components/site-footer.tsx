import Link from "next/link"
import { APP_NAME, CURRENT_YEAR, FOOTER_LINKS } from "@/lib/config"

interface SiteFooterProps {
  description?: string
  className?: string
}

export function SiteFooter({
  description = "Premium furniture for modern living spaces.",
  className,
}: SiteFooterProps) {
  return (
    <footer className={`bg-[#111] text-gray-400 py-12 ${className ?? ""}`.trim()}>
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <span
              className="text-2xl font-bold text-white tracking-wider mb-4 block"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {APP_NAME.toUpperCase()}
            </span>
            <p className="text-sm leading-relaxed">{description}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.NAVIGATION.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.CATEGORIES.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.SUPPORT.map((item) => (
                <li key={item.label}>
                  {"href" in item ? (
                    <Link href={item.href} className="hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="cursor-default">{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm">
          <p>
            &copy; {CURRENT_YEAR} {APP_NAME.toUpperCase()}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
