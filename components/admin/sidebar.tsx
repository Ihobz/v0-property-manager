"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Home, Calendar, Building, LogOut, Database, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  const isActive = (path: string) => {
    if (path === "/admin" && pathname === "/admin") {
      return true
    }
    return path !== "/admin" && pathname.startsWith(path)
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Bookings", href: "/admin/bookings", icon: Calendar },
    { name: "Properties", href: "/admin/properties", icon: Building },
    { name: "Seed Data", href: "/admin/seed", icon: Database },
    { name: "Debug", href: "/admin/debug", icon: AlertTriangle },
  ]

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-4 py-3">
        <h1 className="text-xl font-bold">El Gouna Admin</h1>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                  isActive(item.href) ? "bg-blue-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white px-4 py-3"
          onClick={logout}
        >
          <LogOut size={18} className="mr-3" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  )
}
