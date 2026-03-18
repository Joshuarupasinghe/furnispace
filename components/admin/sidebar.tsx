"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Box,
  Image,
  FolderTree,
  FolderOpen,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Box },
  { name: "Textures", href: "/admin/textures", icon: Image },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Saved Projects", href: "/admin/projects", icon: FolderOpen },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarCollapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("adminSidebarCollapsed", String(newState))
  }

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" })
    window.location.href = "/admin/login"
  }

  return (
    <aside className={cn(
      "flex h-full flex-col border-r border-border bg-card/90 backdrop-blur transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Brand header */}
      <div className="flex h-20 items-center gap-3 border-b border-border px-6">
        <Link href="/admin" className={cn(
          "flex items-center gap-3 transition-opacity hover:opacity-80",
          isCollapsed && "mx-auto"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-primary-foreground font-serif text-lg font-bold">F</span>
          </div>
          {!isCollapsed && (
            <div>
              <span className="block text-lg font-serif tracking-wide text-foreground">FURNISPACE</span>
              <span className="text-[11px] text-muted-foreground tracking-wider uppercase">Admin Panel</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {!isCollapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Menu
          </p>
        )}
        {navigation.map((item) => {
          const isActive = item.href === "/admin" 
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center rounded-xl px-3"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && item.name}
            </Link>
          )
        })}

        {/* 3D Designer — special accent button */}
        <div className={cn("pt-3", !isCollapsed && "px-0")}>
          {!isCollapsed && (
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Tools
            </p>
          )}
          <Link
            href="/admin/designer"
            className={cn(
              "group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200",
              pathname === "/admin/designer" || pathname.startsWith("/admin/designer/")
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30"
                : "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-500 hover:from-violet-600 hover:to-indigo-600 hover:text-white hover:shadow-lg hover:shadow-violet-500/30",
              isCollapsed && "justify-center rounded-xl px-3"
            )}
            title={isCollapsed ? "3D Designer" : undefined}
          >
            <Sparkles className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:rotate-12" />
            {!isCollapsed && "3D Designer"}
          </Link>
        </div>
      </nav>

      {/* Collapse toggle and Logout */}
      <div className="border-t border-border p-4 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              Collapse
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </aside>
  )
}
