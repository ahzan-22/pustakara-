"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface WishlistButtonProps {
  /** Id internal tabel books; null kalau buku belum pernah ada di DB */
  bookId?: string | null
  googleBooksId: string
  title: string
  author?: string | null
  cover?: string | null
  initialWishlisted: boolean
}

/**
 * Tombol hati (simpan buku) di halaman detail buku.
 * Merah terisi = sudah di-wishlist, abu-abu kosong = belum.
 * Toggle lewat POST /api/wishlist, lalu `router.refresh()` supaya
 * section wishlist di Dashboard Server Component ikut ter-update.
 */
export function WishlistButton({
  bookId,
  googleBooksId,
  title,
  author,
  cover,
  initialWishlisted,
}: WishlistButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleToggle = async () => {
    // Belum login -> ke halaman login
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push("/login")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: bookId,
          google_books_id: googleBooksId,
          bookData: { title, author, cover },
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        wishlisted?: boolean
      }

      if (res.status === 401) {
        router.push("/login")
        return
      }

      if (!res.ok) {
        setError(data.error || "Gagal memperbarui wishlist")
        return
      }

      setWishlisted(!!data.wishlisted)
      router.refresh()
    } catch {
      setError("Terjadi kesalahan jaringan")
    } finally {
      setLoading(false)
    }
  }

  const label = wishlisted ? "Hapus dari wishlist" : "Simpan ke wishlist"

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleToggle}
        disabled={loading}
        aria-label={label}
        title={label}
        aria-pressed={wishlisted}
        className={`h-12 w-12 ${
          wishlisted
            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
            : "text-muted-foreground"
        }`}
      >
        <Heart
          className="h-5 w-5"
          fill={wishlisted ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </Button>
      {error && (
        <span className="max-w-[9rem] text-center text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}
