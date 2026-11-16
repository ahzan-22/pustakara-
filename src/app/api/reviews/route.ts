import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { userId, bookId, googleBooksId, bookData, rating, body, isSpoiler } =
      await req.json()

    if (!userId || !rating || !body) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      )
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return NextResponse.json(
        { error: "Rating harus antara 1 sampai 5" },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // 0. Tentukan buku: pakai bookId bila ada, atau cari/buat dari google_books_id
    let resolvedBookId: string | null = bookId ?? null

    if (!resolvedBookId) {
      if (!googleBooksId) {
        return NextResponse.json(
          { error: "bookId atau googleBooksId wajib diisi" },
          { status: 400 },
        )
      }

      const { data: existingBook, error: fetchError } = await supabase
        .from("books")
        .select("id")
        .eq("google_books_id", googleBooksId)
        .maybeSingle()

      if (fetchError) {
        console.error("Fetch book error:", fetchError)
        return NextResponse.json(
          { error: "Gagal mencari buku di database" },
          { status: 500 },
        )
      }

      if (existingBook) {
        resolvedBookId = existingBook.id
      } else {
        // Buku belum pernah ada (belum pernah dipinjam) — buat dulu,
        // sama seperti alur di /api/loans.
        const { data: newBook, error: insertError } = await supabase
          .from("books")
          .insert({
            google_books_id: googleBooksId,
            title: bookData?.title ?? "Tanpa Judul",
            author: bookData?.author ?? "Penulis Tidak Diketahui",
            cover_url: bookData?.cover ?? null,
            synopsis: bookData?.description ?? null,
            year: bookData?.publishedDate
              ? new Date(bookData.publishedDate).getFullYear()
              : null,
            total_copies: 1,
            available_copies: 1,
          })
          .select("id")
          .single()

        if (insertError) {
          console.error("Insert book error:", insertError)
          return NextResponse.json(
            { error: "Gagal menyimpan buku ke database" },
            { status: 500 },
          )
        }

        resolvedBookId = newBook.id
      }
    }

    // 1. Cek riwayat pinjaman user untuk buku ini
    //    is_verified = true hanya jika pernah meminjam dan sudah dikembalikan
    const { data: returnedLoan, error: loanError } = await supabase
      .from("loans")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", resolvedBookId)
      .eq("status", "returned")
      .limit(1)
      .maybeSingle()

    if (loanError) {
      console.error("Fetch loan error:", loanError)
      return NextResponse.json(
        { error: "Gagal memverifikasi riwayat pinjaman" },
        { status: 500 },
      )
    }

    const isVerified = !!returnedLoan

    // 2. Simpan ulasan. Unique index (user_id, book_id) memaksa 1 ulasan per buku.
    //    upsert agar edit ulasan menimpa data lama, bukan membuat baru.
    const { data: review, error: upsertError } = await supabase
      .from("reviews")
      .upsert(
        {
          user_id: userId,
          book_id: resolvedBookId,
          rating,
          body,
          is_spoiler: isSpoiler ?? false,
          is_verified: isVerified,
        },
        { onConflict: "user_id,book_id" },
      )
      .select()
      .single()

    if (upsertError) {
      console.error("Upsert review error:", upsertError)
      return NextResponse.json(
        { error: "Gagal menyimpan ulasan" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Ulasan berhasil disimpan",
      data: review,
    })
  } catch (error) {
    console.error("Review API error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    )
  }
}
