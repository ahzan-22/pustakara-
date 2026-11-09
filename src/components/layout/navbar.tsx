"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, LogIn, Menu, X } from "lucide-react"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border",
        "bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-semibold text-xl tracking-tight text-foreground">
            Pustakara
          </span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3">
                Katalog
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="capitalize">Semua Buku</DropdownMenuItem>
              <DropdownMenuItem className="capitalize">Kategori</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="capitalize">Pencarian</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/dashboard"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Dashboard
          </Link>

          <Button className="h-9 px-4">
            Masuk
            <LogIn className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  Katalog
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem className="capitalize">Semua Buku</DropdownMenuItem>
                <DropdownMenuItem className="capitalize">Kategori</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="capitalize">Pencarian</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/dashboard"
              className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg"
            >
              Dashboard
            </Link>

            <Button className="w-full">Masuk</Button>
          </div>
        </div>
      )}
    </nav>
  )
}
