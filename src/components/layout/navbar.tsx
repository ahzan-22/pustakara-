"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, LogIn, LogOut, Menu, X, User } from "lucide-react"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [session, setSession] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }
    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const userName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "Pengguna"
  const userEmail = session?.user?.email ?? ""

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

          {session ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-sm">
                <span className="font-medium text-foreground">{userName}</span>
                <span className="text-muted-foreground">{userEmail}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Keluar
                <LogOut className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button className="h-9 px-4">
                Masuk
                <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
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

            {session ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm">
                  <span className="block font-medium text-foreground">{userName}</span>
                  <span className="block text-xs text-muted-foreground">{userEmail}</span>
                </div>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  Keluar
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="w-full">Masuk</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
