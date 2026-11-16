import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { userId, bookData } = await req.json()

    if (!userId || !bookData) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // 1. Cek apakah buku sudah ada di tabel books berdasarkan google_books_id
    const { data: existingBook, error: fetchError } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", bookData.id)
      .single()

    let bookId: string

    if (fetchError || !existingBook) {
      // 2. Jika belum ada, INSERT buku baru ke tabel books
      const { data: newBook, error: insertError } = await supabase
        .from("books")
        .insert({
          google_books_id: bookData.id,
          title: bookData.title,
          author: bookData.author ?? "Penulis Tidak Diketahui",
          cover_url: bookData.cover ?? null,
          synopsis: bookData.description ?? null,
          year: bookData.publishedDate
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

      bookId = newBook.id
    } else {
      bookId = existingBook.id
    }

    // 3. INSERT ke tabel loans dengan status 'pending'
    const { error: loanError } = await supabase.from("loans").insert({
      user_id: userId,
      book_id: bookId,
      status: "pending",
    })

    if (loanError) {
      console.error("Insert loan error:", loanError)
      return NextResponse.json(
        { error: "Gagal mengajukan pinjaman" },
        { status: 500 },
      )
    }

    // 4. Return response sukses
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
