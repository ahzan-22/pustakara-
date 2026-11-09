import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BorrowButton } from "@/components/books/borrow-button"
import { getBookById, type GoogleBook } from "@/lib/google-books"

async function BookDetailContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let book: GoogleBook
  try {
    book = await getBookById(id)
  } catch {
    notFound()
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

            <BorrowButton />
          </div>
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
