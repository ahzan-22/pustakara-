import { connection } from "next/server"

import { createClient } from "@/lib/supabase/server"
import type { GoogleBook } from "@/lib/google-books"
import { ReviewForm } from "./review-form"
import { ReviewList, type ReviewItem } from "./review-list"

type ReviewRow = {
  id: string
  user_id: string
  rating: number | null
  body: string | null
  is_spoiler: boolean | null
  is_verified: boolean | null
  created_at: string | null
  profiles?: { full_name?: string | null } | null
}

/** Fallback skeleton saat data ulasan masih dimuat */
export function ReviewsSectionFallback() {
  return (
    <section aria-busy="true" className="flex flex-col gap-6">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-48 w-full animate-pulse rounded-xl bg-muted" />
      <div className="space-y-4">
        <div className="h-28 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-28 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </section>
  )
}

/**
 * Section "Ulasan Pembaca" di halaman detail buku.
 * Di-render di server: query Supabase + join nama reviewer.
 */
export async function ReviewsSection({ book }: { book: GoogleBook }) {
  await connection()

  const supabase = await createClient()

  // 1. Cari ID internal buku berdasarkan google_books_id
  const { data: bookRow, error: bookError } = await supabase
    .from("books")
    .select("id")
    .eq("google_books_id", book.id)
    .maybeSingle()

  if (bookError) {
    console.error("Fetch book error:", bookError.message)
  }

  let reviews: ReviewItem[] = []

  if (bookRow) {
    // 2. Ambil ulasan published + join nama lewat relasi profiles
    const { data: joinedData, error: joinError } = await supabase
      .from("reviews")
      .select(
        `
        id,
        user_id,
        rating,
        body,
        is_spoiler,
        is_verified,
        created_at,
        profiles ( full_name )
      `,
      )
      .eq("book_id", bookRow.id)
      .eq("status", "published")
      .order("is_verified", { ascending: false })
      .order("created_at", { ascending: false })

    let rows: ReviewRow[] = []

    if (joinError || !joinedData) {
      // Fallback bila relasi profiles tidak tersedia:
      // ambil reviews dulu, lalu nama user lewat query terpisah.
      if (joinError) {
        console.error(
          "Join profiles gagal, fallback query terpisah:",
          joinError.message,
          joinError.code,
        )
      }

      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("id, user_id, rating, body, is_spoiler, is_verified, created_at")
        .eq("book_id", bookRow.id)
        .eq("status", "published")
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false })

      if (reviewError) {
        console.error("Gagal memuat ulasan:", reviewError.message)
      } else {
        rows = (reviewData ?? []) as ReviewRow[]

        const userIds = Array.from(
          new Set(rows.map((row) => row.user_id).filter(Boolean)),
        )

        if (userIds.length > 0) {
          const { data: profileRows } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds)

          const nameById = new Map(
            (profileRows ?? []).map(
              (row: { id: string; full_name: string | null }) => [
                row.id,
                row.full_name,
              ],
            ),
          )

          rows = rows.map((row) => ({
            ...row,
            profiles: { full_name: nameById.get(row.user_id) ?? null },
          }))
        }
      }
    } else {
      rows = joinedData as unknown as ReviewRow[]
    }

    reviews = rows.map((row) => ({
      id: row.id,
      userName: row.profiles?.full_name?.trim() || "Pembaca",
      rating: row.rating ?? 0,
      body: row.body ?? "",
      isSpoiler: !!row.is_spoiler,
      isVerified: !!row.is_verified,
      createdAt: row.created_at,
    }))
  }

  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-6">
      <div>
        <h2
          id="reviews-heading"
          className="text-xl font-bold tracking-tight sm:text-2xl"
        >
          Ulasan Pembaca
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {reviews.length > 0
            ? `${reviews.length} ulasan — label ✅ diberikan kepada peminjam yang sudah mengembalikan buku.`
            : "Jadilah yang pertama mengulas buku ini."}
        </p>
      </div>

      {/* Form ulasan (client component) */}
      <ReviewForm
        bookId={bookRow?.id ?? null}
        bookData={{
          id: book.id,
          title: book.title,
          author: book.author ?? null,
          cover: book.thumbnail ?? null,
          description: book.description ?? null,
          publishedDate: book.publishedDate ?? null,
        }}
      />

      {/* Daftar ulasan */}
      <ReviewList reviews={reviews} />
    </section>
  )
}
