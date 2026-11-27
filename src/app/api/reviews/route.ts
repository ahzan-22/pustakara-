import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeBookData, sanitizeGoogleBooksId } from "@/lib/book-data"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BODY = 5000

export async function POST(req: NextRequest) {
  try {
    const { bookId, googleBooksId, bookData, rating, body, isSpoiler } =
      await req.json()

    const numericRating = Number(rating)

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        { error: "Rating harus antara 1 sampai 5" },
        { status: 400 },
      )
    }

    const reviewBody = typeof body === "string" ? body.trim() : ""

    if (!reviewBody) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      )
    }

    // Hanya terima UUID sebagai bookId; kalau tidak, pakai jalur google_books_id.
    const safeBookId =
      typeof bookId === "string" && UUID.test(bookId) ? bookId : null
    const safeGoogleBooksId = sanitizeGoogleBooksId(googleBooksId)
    const safeBookData = sanitizeBookData(bookData)

    const supabase = await createClient()

    // Identitas penulis diambil dari session login, bukan dari body,
    // supaya ulasan tidak bisa dibuat atas nama orang lain.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu" },
        { status: 401 },
      )
    }

    // 0. Tentukan buku: pakai bookId bila ada, atau cari/buat dari google_books_id
    let resolvedBookId: string | null = safeBookId

    if (!resolvedBookId) {
      if (!safeGoogleBooksId) {
        return NextResponse.json(
          { error: "bookId atau googleBooksId wajib diisi" },
          { status: 400 },
        )
      }

      const { data: existingBook, error: fetchError } = await supabase
        .from("books")
        .select("id")
        .eq("google_books_id", safeGoogleBooksId)
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
            google_books_id: safeGoogleBooksId,
            title: safeBookData.title || "Tanpa Judul",
            author: safeBookData.author || "Penulis Tidak Diketahui",
            cover_url: safeBookData.cover,
            synopsis: safeBookData.description,
            year: safeBookData.publishedDate
              ? new Date(safeBookData.publishedDate).getFullYear()
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
      .eq("user_id", user.id)
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
          user_id: user.id,
          book_id: resolvedBookId,
          rating: numericRating,
          body: reviewBody.slice(0, MAX_BODY),
          is_spoiler: isSpoiler === true,
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
