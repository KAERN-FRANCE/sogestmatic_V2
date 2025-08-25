"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useAuth()

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/prochaines-reglementations", label: "Prochaine Réglementation" },
    { href: "/indicateurs-indemnites", label: "Indicateurs & Indemnités" },
    { href: "/livre-blanc", label: "Livre Blanc" },
    { href: "/assistant-ia", label: "Assistant IA" },
    { href: "/compte", label: "Mon Compte" },
  ]

  if (user?.role === "admin") {
    navLinks.push({ href: "/admin", label: "Administration" })
  }

  return (
    <nav className="bg-primary border-b border-primary-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3">
            <Link href="/" className="relative h-20 p-2 hover:opacity-80 transition-opacity w-40">
              <Image
                src="/sogestmatic-logo.png"
                alt="Sogestmatic Logo"
                width={80}
                height={80}
                className="object-contain w-full h-full"
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-green-accent transition-colors duration-200 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="ml-4 bg-green-accent hover:bg-green-accent-dark text-white">
              <Link href="/assistant-ia">Accéder à l'IA</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-green-accent"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-dark">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white hover:text-green-accent transition-colors duration-200 text-sm font-medium px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button asChild className="mt-4 mx-2 bg-green-accent hover:bg-green-accent-dark text-white">
                <Link href="/assistant-ia" onClick={() => setIsMenuOpen(false)}>
                  Accéder à l'IA
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
