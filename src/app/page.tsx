'use client';

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { searchBooks, type GoogleBook } from "@/lib/google-books"

// Kata kunci bawaan untuk menampilkan rekomendasi saat halaman dimuat
const DEFAULT_KEYWORD = "bestseller";

// Grid card yang sama dipakai untuk rekomendasi maupun hasil pencarian
function BookGrid({ books }: { books: GoogleBook[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {books.map((book, index) => (
        <Link
          key={book.id || `book-${index}`}
          href={`/books/${book.id}`}
        >
          <Card
            key={book.id || `book-${index}`}
            className="flex flex-col h-full cursor-pointer hover:shadow-md transition-shadow duration-200"
          >
          <CardHeader className="p-0">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted relative">
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={`Cover buku ${book.title}`}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    Tidak ada cover
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <CardTitle className="line-clamp-2 leading-snug">
              {book.title}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {book.author || "Penulis tidak diketahui"}
            </p>
          </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// Skeleton grid agar layout tidak melompat saat rekomendasi dimuat
function BookGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-lg bg-muted" />
          <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<GoogleBook[]>([]);
  const [searched, setSearched] = useState(false);
  const [recommendations, setRecommendations] = useState<GoogleBook[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Muat rekomendasi otomatis saat halaman pertama kali dimuat.
  // State input search (query) tidak disentuh.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const results = await searchBooks(DEFAULT_KEYWORD);
        if (!cancelled) setRecommendations(results);
      } catch {
        if (!cancelled) setRecommendations([]);
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!query.trim()) {
        // Pencarian dikosongkan: kembali menampilkan rekomendasi
        setBooks([]);
        setSearched(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await searchBooks(query);
        setBooks(results);
        setSearched(true);
      } catch {
        setError("Gagal memuat hasil pencarian. Coba lagi nanti.");
        setBooks([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Temukan Buku Berikutnya
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Jelajahi jutaan buku dari Google Books. Cari judul, penulis, atau
              topik yang Anda sukai.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Cari buku… (contoh: Harry Potter, Python, Filsafat)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(e);
                  }
                }}
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading} className="shrink-0">
                {loading ? "Mencari…" : "Cari"}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <div className="mt-10 flex flex-col items-center justify-center gap-2 p-8">
              <span className="animate-pulse font-medium">Mencari buku…</span>
            </div>
          ) : searched ? (
            // --- Hasil pencarian user (menggantikan rekomendasi) ---
            books.length > 0 ? (
              <>
                <div className="mt-8 mb-4 text-sm font-medium text-muted-foreground">
                  Menampilkan {books.length} hasil
                </div>
                <BookGrid books={books} />
              </>
            ) : (
              <div className="mt-10 text-center text-muted-foreground">
                Buku tidak ditemukan. Coba kata kunci lain.
              </div>
            )
          ) : (
            // --- Rekomendasi bawaan sebelum user mencari ---
            <>
              <div className="mt-10 mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                  Rekomendasi Buku Populer
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pilihan buku populer untuk Anda jelajahi sebelum mulai mencari.
                </p>
              </div>

              {recLoading ? (
                <BookGridSkeleton />
              ) : recommendations.length > 0 ? (
                <BookGrid books={recommendations} />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Rekomendasi belum tersedia. Coba cari buku di atas.
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
