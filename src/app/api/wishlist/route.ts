import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

type BookData = {
  title?: string | null
  author?: string | null
  cover?: string | null
  description?: string | null
  publishedDate?: string | null
}

/**
 * POST   /api/wishlist
 *        body: { book_id?, google_books_id?, bookData? }
 *        Toggle: belum ada -> INSERT, sudah ada -> DELETE.
 * DELETE /api/wishlist?book_id=<uuid>
 *        Hapus buku dari wishlist user yang login.
 *
 * User selalu diambil dari session login, tidak pernah dari body,
 * supaya wishlist orang lain tidak bisa dimanipulasi.
 */

/**
 * Dapatkan id internal tabel books. Kalau buku belum pernah ada di DB
 * (barusan dilihat dari halaman detail), buat dulu — pola yang sama dengan
 * /api/loans dan /api/reviews.
 */
async function resolveBookId(
  supabase: SupabaseServer,
  opts: { bookId?: string | null; googleBooksId?: string | null; bookData?: BookData | null },
): Promise<{ bookId: string | null; error?: string }> {
  if (opts.bookId) return { bookId: opts.bookId }

  if (!opts.googleBooksId) {
    return { bookId: null, error: "book_id atau google_books_id wajib diisi" }
  }

  const { data: existing, error: fetchError } = await supabase
    .from("books")
    .select("id")
    .eq("google_books_id", opts.googleBooksId)
    .maybeSingle()

  if (fetchError) {
    console.error("Cari buku error:", fetchError.message, fetchError.code)
    return { bookId: null, error: "Gagal mencari buku di database" }
  }

  if (existing) return { bookId: existing.id }

  const { data: created, error: insertError } = await supabase
    .from("books")
    .insert({
      google_books_id: opts.googleBooksId,
      title: opts.bookData?.title || "Tanpa Judul",
      author: opts.bookData?.author || "Penulis Tidak Diketahui",
      cover_url: opts.bookData?.cover ?? null,
      synopsis: opts.bookData?.description ?? null,
      year: opts.bookData?.publishedDate
        ? new Date(opts.bookData.publishedDate).getFullYear()
        : null,
      total_copies: 1,
      available_copies: 1,
    })
    .select("id")
    .single()

  if (insertError) {
    console.error("Insert buku error:", insertError.message, insertError.code)
    return { bookId: null, error: "Gagal menyimpan buku ke database" }
  }

  return { bookId: created.id }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const bookId: string | null = body?.book_id ?? null
    const googleBooksId: string | null = body?.google_books_id ?? null
    const bookData: BookData | null = body?.bookData ?? null

    if (!bookId && !googleBooksId) {
      return NextResponse.json(
        { error: "book_id atau google_books_id wajib diisi" },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // 1. Autentikasi
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu" },
        { status: 401 },
      )
    }

    // 2. Dapatkan id internal buku
    const resolved = await resolveBookId(supabase, {
      bookId,
      googleBooksId,
      bookData,
    })

    if (!resolved.bookId) {
      return NextResponse.json(
        { error: resolved.error ?? "Gagal mencari buku" },
        { status: 500 },
      )
    }

    const resolvedBookId = resolved.bookId

    // 3. Sudah ada di wishlist user ini?
    const { data: existing, error: checkError } = await supabase
      .from("wishlists")
      .select("book_id")
      .eq("user_id", user.id)
      .eq("book_id", resolvedBookId)
      .maybeSingle()

    if (checkError) {
      console.error(
        "Cek wishlist error:",
        checkError.message,
        checkError.code,
      )
      return NextResponse.json(
        { error: "Gagal memeriksa wishlist" },
        { status: 500 },
      )
    }

    // 4a. Sudah ada -> hapus (toggle)
    if (existing) {
      const { error: removeError } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("book_id", resolvedBookId)

      if (removeError) {
        console.error(
          "Hapus wishlist error:",
          removeError.message,
          removeError.code,
        )
        return NextResponse.json(
          { error: "Gagal menghapus dari wishlist" },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        wishlisted: false,
        message: "Buku dihapus dari wishlist",
      })
    }

    // 4b. Belum ada -> simpan
    const { error: insertError } = await supabase.from("wishlists").insert({
      user_id: user.id,
      book_id: resolvedBookId,
    })

    if (insertError) {
      console.error(
        "Simpan wishlist error:",
        insertError.message,
        insertError.code,
      )
      return NextResponse.json(
        { error: "Gagal menyimpan ke wishlist" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      wishlisted: true,
      message: "Buku disimpan ke wishlist",
    })
  } catch (error) {
    console.error("Wishlist API error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const bookId = req.nextUrl.searchParams.get("book_id")

    if (!bookId) {
      return NextResponse.json(
        { error: "book_id wajib diisi" },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // 1. Autentikasi
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu" },
        { status: 401 },
      )
    }

    // 2. Hapus milik user yang login saja
    const { error: removeError } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("book_id", bookId)

    if (removeError) {
      console.error(
        "Hapus wishlist error:",
        removeError.message,
        removeError.code,
      )
      return NextResponse.json(
        { error: "Gagal menghapus dari wishlist" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      wishlisted: false,
      message: "Buku dihapus dari wishlist",
    })
  } catch (error) {
    console.error("Wishlist DELETE error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    )
  }
}
