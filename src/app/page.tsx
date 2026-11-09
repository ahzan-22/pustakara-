'use client';

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { searchBooks, type GoogleBook } from "@/lib/google-books";

export default function Home() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!query.trim()) {
        setBooks([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await searchBooks(query);
        setBooks(results);
      } catch {
        setError("Gagal memuat hasil pencarian. Coba lagi nanti.");
        setBooks([]);
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
          ) : books.length > 0 ? (
            <>
              <div className="mt-8 mb-4 text-sm font-medium text-muted-foreground">
                Menampilkan {books.length} hasil
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {books.map((book) => (
                  <Card
                    key={book.id}
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
                ))}
              </div>
            </>
          ) : (
            <div className="mt-10 text-center text-muted-foreground">
              Mulai mencari buku dengan mengetik kata kunci di atas.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
