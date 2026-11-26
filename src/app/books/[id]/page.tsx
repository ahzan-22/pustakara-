import { Suspense } from "react"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BorrowButton } from "@/components/books/borrow-button"
import { WishlistButton } from "@/components/books/wishlist-button"
import {
  ReviewsSection,
  ReviewsSectionFallback,
} from "@/components/books/reviews-section"
import { getBookById, type GoogleBook } from "@/lib/google-books"
import { createClient } from "@/lib/supabase/server"

async function BookDetailContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Query Supabase tidak boleh jalan saat prerender (bikin blocking route).
  await connection()

  const { id } = await params

  let book: GoogleBook
  try {
    book = await getBookById(id)
  } catch {
    notFound()
  }

  // Stok ada di DB kita, bukan di Google Books. Buku yang belum pernah
  // dipinjam/diulas belum ada barisnya -> stok default 1.
  const supabase = await createClient()
  const { data: bookRow } = await supabase
    .from("books")
    .select("id, available_copies")
    .eq("google_books_id", book.id)
    .maybeSingle()

  const stock = bookRow?.available_copies ?? 1

  // Status wishlist user yang login (false kalau belum login
  // atau buku belum pernah ada di tabel books)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let wishlisted = false
  if (user && bookRow) {
    const { data: savedRow } = await supabase
      .from("wishlists")
      .select("book_id")
      .eq("user_id", user.id)
      .eq("book_id", bookRow.id)
      .maybeSingle()

    wishlisted = !!savedRow
  }

  const coverUrl = book.thumbnail ?? "https://placehold.co/300x450?text=No+Cover"
  const year = book.publishedDate ? new Date(book.publishedDate).getFullYear() : "-"

  return (
    <>
      <nav className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Kembali ke Beranda
        </Link>
      </nav>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kolom kiri: Gambar cover */}
          <div className="flex flex-col items-center">
            <Card className="w-full max-w-md aspect-[2/3] overflow-hidden">
              <img
                src={coverUrl}
                alt={`Cover buku ${book.title}`}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </Card>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              {book.thumbnail ? "Sampul buku" : "Tidak ada cover tersedia"}
            </p>
          </div>

          {/* Kolom kanan: Judul, penulis, tahun, sinopsis, tombol */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="flex-shrink-0 aspect-[1/1] w-20 h-20 rounded-xl bg-muted overflow-hidden">
                  {book.thumbnail ? (
                    <img
                      src={book.thumbnail}
                      alt={`Cover ${book.title}`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground">
                        No Cover
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl lg:text-3xl leading-tight">
                    {book.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {book.author ?? "Penulis tidak diketahui"} • {year}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Sinopsis
                </h3>
                <p className="text-lg leading-relaxed text-foreground">
                  {book.description ? (
                    book.description
                  ) : (
                    <span className="text-muted-foreground">
                      Sinopsis tidak tersedia untuk buku ini.
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <p className="text-sm font-medium text-muted-foreground">
              Sisa Stok:{" "}
              <span
                className={
                  stock > 0
                    ? "text-foreground"
                    : "font-semibold text-destructive"
                }
              >
                {stock}
              </span>
            </p>

            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {stock > 0 ? (
                  <BorrowButton
                    bookData={{
                      id: book.id,
                      title: book.title,
                      author: book.author ?? null,
                      cover: book.thumbnail ?? null,
                      description: book.description ?? null,
                      publishedDate: book.publishedDate ?? null,
                    }}
                  />
                ) : (
                  <Button
                    disabled
                    variant="destructive"
                    className="w-full py-4 text-lg"
                  >
                    Stok Habis
                  </Button>
                )}
              </div>

              <WishlistButton
                bookId={bookRow?.id ?? null}
                googleBooksId={book.id}
                title={book.title}
                author={book.author ?? null}
                cover={book.thumbnail ?? null}
                initialWishlisted={wishlisted}
              />
            </div>
          </div>
        </div>

        {/* Ulasan Pembaca — di bawah tombol Pinjam */}
        <div className="max-w-6xl mx-auto mt-12 border-t border-border pt-10">
          <Suspense fallback={<ReviewsSectionFallback />}>
            <ReviewsSection book={book} />
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<div className="container mx-auto px-4 py-12">Memuat detail buku...</div>}>
        <BookDetailContent params={params} />
      </Suspense>
    </div>
  )
}
