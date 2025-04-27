"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAdmin, signOut } = useAuth()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gouna-blue">
            El Gouna Rentals
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-gray-600 hover:text-gouna-blue ${isActive("/") ? "font-semibold text-gouna-blue" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/properties"
              className={`text-gray-600 hover:text-gouna-blue ${
                isActive("/properties") ? "font-semibold text-gouna-blue" : ""
              }`}
            >
              Properties
            </Link>
            <Link
              href="/about"
              className={`text-gray-600 hover:text-gouna-blue ${
                isActive("/about") ? "font-semibold text-gouna-blue" : ""
              }`}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`text-gray-600 hover:text-gouna-blue ${
                isActive("/contact") ? "font-semibold text-gouna-blue" : ""
              }`}
            >
              Contact
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`text-gray-600 hover:text-gouna-blue ${
                  pathname.startsWith("/admin") ? "font-semibold text-gouna-blue" : ""
                }`}
              >
                Admin
              </Link>
            )}

            {user ? (
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            ) : (
              <Link href="/admin/login">
                <Button variant="outline">Login</Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 space-y-4 pb-4">
            <Link
              href="/"
              className={`block text-gray-600 hover:text-gouna-blue ${
                isActive("/") ? "font-semibold text-gouna-blue" : ""
              }`}
              onClick={closeMenu}
            >
              Home
            </Link>
            <Link
              href="/properties"
              className={`block text-gray-600 hover:text-gouna-blue ${
                isActive("/properties") ? "font-semibold text-gouna-blue" : ""
              }`}
              onClick={closeMenu}
            >
              Properties
            </Link>
            <Link
              href="/about"
              className={`block text-gray-600 hover:text-gouna-blue ${
                isActive("/about") ? "font-semibold text-gouna-blue" : ""
              }`}
              onClick={closeMenu}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`block text-gray-600 hover:text-gouna-blue ${
                isActive("/contact") ? "font-semibold text-gouna-blue" : ""
              }`}
              onClick={closeMenu}
            >
              Contact
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`block text-gray-600 hover:text-gouna-blue ${
                  pathname.startsWith("/admin") ? "font-semibold text-gouna-blue" : ""
                }`}
                onClick={closeMenu}
              >
                Admin
              </Link>
            )}

            {user ? (
              <Button variant="outline" onClick={signOut} className="w-full">
                Sign Out
              </Button>
            ) : (
              <Link href="/admin/login" className="block" onClick={closeMenu}>
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
