"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ReviewFormProps {
  /** ID internal buku (tabel books). Null jika buku belum pernah masuk database. */
  bookId?: string | null
  /** Data buku dari Google Books — dipakai API untuk membuat baris books bila perlu. */
  bookData: {
    id: string
    title: string
    author?: string | null
    cover?: string | null
    description?: string | null
    publishedDate?: string | null
  }
}

const MIN_CHARS = 10
const MAX_CHARS = 1000

export function ReviewForm({ bookId, bookData }: ReviewFormProps) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [checking, setChecking] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [rating, setRating] = useState(0)
  const [body, setBody] = useState("")
  const [isSpoiler, setIsSpoiler] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: "success" | "error"
  } | null>(null)

  // Cek sesi user + muat ulasannya (mode edit) jika sudah pernah mengulas
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return
      setIsLoggedIn(!!session)
      setChecking(false)

      if (session && bookId) {
        const { data: existing } = await supabase
          .from("reviews")
          .select("rating, body, is_spoiler")
          .eq("user_id", session.user.id)
          .eq("book_id", bookId)
          .maybeSingle()

        if (cancelled || !existing) return
        setRating(existing.rating ?? 0)
        setBody(existing.body ?? "")
        setIsSpoiler(!!existing.is_spoiler)
        setIsEditing(true)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [supabase, bookId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (rating < 1) {
      setMessage({ text: "Pilih rating bintang terlebih dahulu", type: "error" })
      return
    }

    const trimmed = body.trim()
    if (trimmed.length < MIN_CHARS) {
      setMessage({
        text: `Ulasan minimal ${MIN_CHARS} karakter`,
        type: "error",
      })
      return
    }
    if (trimmed.length > MAX_CHARS) {
      setMessage({
        text: `Ulasan maksimal ${MAX_CHARS} karakter`,
        type: "error",
      })
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push("/login")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          bookId: bookId ?? null,
          googleBooksId: bookData.id,
          bookData,
          rating,
          body: trimmed,
          isSpoiler,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          text: isEditing
            ? "Ulasan berhasil diperbarui"
            : "Ulasan berhasil disimpan",
          type: "success",
        })
        // Muat ulang Server Component agar daftar ulasan ikut berubah
        router.refresh()
      } else {
        setMessage({
          text: data.error || "Gagal menyimpan ulasan",
          type: "error",
        })
      }
    } catch {
      setMessage({ text: "Terjadi kesalahan jaringan", type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  // Guest: cukup tawarkan tombol login
  if (checking) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!isLoggedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tulis Ulasan</CardTitle>
          <CardDescription>
            Masuk untuk menulis ulasan dan mengikuti program pinjam buku.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Masuk untuk mengulas</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? "Edit Ulasan Anda" : "Tulis Ulasan"}
        </CardTitle>
        <CardDescription>
          Rating 1–5 bintang dan ulasan 10–1000 karakter. Buku yang pernah Anda
          kembalikan akan diberi label terverifikasi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}
              role="status"
            >
              {message.text}
            </div>
          )}

          {/* Rating bintang */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="review-rating">Rating</Label>
            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  id={value === 1 ? "review-rating" : undefined}
                  type="button"
                  aria-label={`Beri rating ${value} bintang`}
                  aria-pressed={rating === value}
                  onClick={() => setRating(value)}
                  className={`text-3xl leading-none transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded ${
                    value <= rating
                      ? "text-amber-500"
                      : "text-muted-foreground/30 hover:text-amber-400"
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating} dari 5` : "Belum dipilih"}
              </span>
            </div>
          </div>

          {/* Isi ulasan */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="review-body">Ulasan</Label>
              <span
                className={`text-xs ${
                  body.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {body.length}/{MAX_CHARS}
              </span>
            </div>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ceritakan pengalaman Anda membaca buku ini…"
              rows={5}
              maxLength={MAX_CHARS}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            />
          </div>

          {/* Checkbox spoiler */}
          <div className="flex items-center gap-2">
            <input
              id="review-spoiler"
              type="checkbox"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-input accent-primary"
            />
            <Label
              htmlFor="review-spoiler"
              className="font-normal text-muted-foreground"
            >
              Mengandung spoiler
            </Label>
          </div>

          <Button type="submit" disabled={submitting} className="self-start px-6">
            {submitting
              ? "Menyimpan…"
              : isEditing
                ? "Simpan Perubahan"
                : "Kirim Ulasan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
