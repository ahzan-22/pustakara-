import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sanitizeBookData, sanitizeGoogleBooksId } from "@/lib/book-data"

// Status pinjaman yang masih mengikat buku (belum boleh dipinjam orang lain)
const ACTIVE_LOAN_STATUSES = ["pending", "approved", "borrowed", "overdue"]

export async function POST(req: NextRequest) {
  try {
    const { bookData } = await req.json()

    if (!bookData) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Identitas pengambil diambil dari session login, bukan dari body,
    // supaya pinjaman tidak bisa diajukan atas nama orang lain.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu" },
        { status: 401 },
      )
    }

    const googleBooksId = sanitizeGoogleBooksId(bookData.id)

    if (!googleBooksId) {
      return NextResponse.json(
        { error: "ID buku Google Books tidak valid" },
        { status: 400 },
      )
    }

    const book = sanitizeBookData(bookData)

    // 1. Cek apakah buku sudah ada di tabel books berdasarkan google_books_id
    const { data: existingBook, error: fetchError } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", googleBooksId)
      .single()

    let bookId: string

    if (fetchError || !existingBook) {
      // 2. Jika belum ada, INSERT buku baru ke tabel books
      const { data: newBook, error: insertError } = await supabase
        .from("books")
        .insert({
          google_books_id: googleBooksId,
          title: book.title || "Tanpa Judul",
          author: book.author || "Penulis Tidak Diketahui",
          cover_url: book.cover,
          synopsis: book.description,
          year: book.publishedDate
            ? new Date(book.publishedDate).getFullYear()
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

      bookId = newBook.id
    } else {
      bookId = existingBook.id
    }

    // 3. Tolak pengajuan dobel: user ini sudah punya pinjaman aktif utk buku ini
    const { data: activeLoan, error: dupError } = await supabase
      .from("loans")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .in("status", ACTIVE_LOAN_STATUSES)
      .limit(1)
      .maybeSingle()

    if (dupError) {
      console.error(
        "Cek pinjaman aktif error:",
        dupError.message,
        dupError.code,
      )
      return NextResponse.json(
        { error: "Gagal memeriksa riwayat pinjaman" },
        { status: 500 },
      )
    }

    if (activeLoan) {
      return NextResponse.json(
        { error: "Anda sudah mengajukan atau meminjam buku ini" },
        { status: 409 },
      )
    }

    // 4. INSERT ke tabel loans dengan status 'pending'
    const { error: loanError } = await supabase.from("loans").insert({
      user_id: user.id,
      book_id: bookId,
      status: "pending",
    })

    if (loanError) {
      // 23505 = unique index loans_one_active_per_user_book: pengajuan dobel
      // yang lolos cek di atas karena datang bersamaan.
      if (loanError.code === "23505") {
        return NextResponse.json(
          { error: "Anda sudah mengajukan atau meminjam buku ini" },
          { status: 409 },
        )
      }
      console.error("Insert loan error:", loanError)
      return NextResponse.json(
        { error: "Gagal mengajukan pinjaman" },
        { status: 500 },
      )
    }

    // 5. Return response sukses
    return NextResponse.json({
      success: true,
      message: "Pinjaman berhasil diajukan",
    })
  } catch (error) {
    console.error("Loan API error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    )
  }
}
