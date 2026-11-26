import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type RouteContext = { params: Promise<{ id: string }> }

const LOAN_ACTIONS = ["approve", "reject", "return"] as const
type LoanAction = (typeof LOAN_ACTIONS)[number]

function isLoanAction(value: unknown): value is LoanAction {
  return (
    typeof value === "string" && LOAN_ACTIONS.includes(value as LoanAction)
  )
}

/**
 * PATCH /api/admin/loans/[id]
 * Body: { action: "approve" | "reject" | "return" }
 *
 * - approve -> status 'borrowed', borrowed_at = sekarang, due_at = sekarang + 14 hari,
 *              available_copies buku -1
 * - reject  -> status 'rejected'
 * - return  -> status 'returned', returned_at = sekarang, available_copies buku +1,
 *              lalu auto-verify ulasan user tsb utk buku tsb (is_verified = true)
 * Hanya user dengan role 'admin' yang diizinkan.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "ID peminjaman tidak valid" },
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

    // 2. Otorisasi: hanya admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil pengguna tidak ditemukan" },
        { status: 403 },
      )
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat melakukan aksi ini" },
        { status: 403 },
      )
    }

    // 3. Validasi payload
    let action: unknown
    try {
      const body = await req.json()
      action = body?.action
    } catch {
      return NextResponse.json(
        { error: "Payload tidak valid" },
        { status: 400 },
      )
    }

    if (!isLoanAction(action)) {
      return NextResponse.json(
        { error: "Action harus 'approve', 'reject', atau 'return'" },
        { status: 400 },
      )
    }

    // 4. Ambil data loan dulu untuk dapatkan `book_id`.
    //    Filter status di sini sekaligus jadi guard: approve/reject hanya dari
    //    'pending', return hanya dari 'borrowed' -> stok tidak pernah dobel.
    const expectedStatus = action === "return" ? "borrowed" : "pending"

    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("id, user_id, book_id")
      .eq("id", id)
      .eq("status", expectedStatus)
      .maybeSingle()

    if (loanError) {
      console.error("Fetch loan error:", loanError.message, loanError.code)
      return NextResponse.json(
        { error: "Gagal memuat peminjaman" },
        { status: 500 },
      )
    }

    if (!loan) {
      return NextResponse.json(
        { error: "Peminjaman tidak ditemukan atau sudah diproses" },
        { status: 404 },
      )
    }

    // 5. Update stok buku SEBELUM status loan, supaya kalau stok gagal
    //    loan-nya belum berubah dan bisa dicoba ulang.
    if (action === "approve" || action === "return") {
      const { data: book, error: bookError } = await supabase
        .from("books")
        .select("available_copies")
        .eq("id", loan.book_id)
        .maybeSingle()

      if (bookError || !book) {
        console.error(
          "Ambil stok buku error:",
          bookError?.message,
          bookError?.code,
          "book_id:",
          loan.book_id,
        )
        return NextResponse.json(
          { error: "Gagal membaca stok buku" },
          { status: 500 },
        )
      }

      const currentStock = book.available_copies ?? 0

      if (action === "approve" && currentStock <= 0) {
        // Stok habis: jangan sampai jadi minus, approve tetap dilanjutkan.
        console.error(
          "Stok buku habis (0), pengurangan stok dilewati. book_id:",
          loan.book_id,
        )
      } else {
        const nextStock =
          action === "approve" ? currentStock - 1 : currentStock + 1

        const { data: savedBook, error: saveError } = await supabase
          .from("books")
          .update({ available_copies: nextStock })
          .eq("id", loan.book_id)
          .select("available_copies")
          .maybeSingle()

        if (saveError) {
          console.error(
            "Update stok buku error:",
            saveError.message,
            saveError.code,
            "book_id:",
            loan.book_id,
          )
          return NextResponse.json(
            { error: "Gagal memperbarui stok buku" },
            { status: 500 },
          )
        }

        if (!savedBook) {
          // PostgREST diam-diam kalau RLS memblokir: 0 baris, tanpa error.
          console.error(
            "Update stok buku tidak mengenai baris apa pun (kemungkinan RLS masih memblokir). book_id:",
            loan.book_id,
          )
          return NextResponse.json(
            { error: "Stok buku gagal diperbarui (kemungkinan RLS)" },
            { status: 500 },
          )
        }

        console.log(
          `Stok buku ${loan.book_id}: ${currentStock} -> ${savedBook.available_copies}`,
        )
      }
    }

    // 6. Update status loan (status awal sudah divalidasi di langkah 4)
    const now = new Date()
    const dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const payload =
      action === "approve"
        ? {
            status: "borrowed",
            borrowed_at: now.toISOString(),
            due_at: dueAt.toISOString(),
          }
        : action === "return"
          ? { status: "returned", returned_at: now.toISOString() }
          : { status: "rejected" }

    const { data: updated, error: updateError } = await supabase
      .from("loans")
      .update(payload)
      .eq("id", id)
      .eq("status", expectedStatus)
      .select("id, user_id, book_id")
      .maybeSingle()

    if (updateError) {
      console.error("Update loan error:", updateError.message, updateError.code)
      return NextResponse.json(
        { error: "Gagal memperbarui peminjaman" },
        { status: 500 },
      )
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Peminjaman tidak ditemukan atau sudah diproses" },
        { status: 404 },
      )
    }

    // 7. Auto-verify ulasan: buku sudah dikembalikan -> is_verified = true
    if (action === "return") {
      const { error: reviewError } = await supabase
        .from("reviews")
        .update({ is_verified: true })
        .eq("user_id", updated.user_id)
        .eq("book_id", updated.book_id)

      if (reviewError) {
        console.error(
          "Auto verify review error:",
          reviewError.message,
          reviewError.code,
        )
        return NextResponse.json(
          { error: "Buku berhasil dikembalikan, tetapi verifikasi ulasan gagal" },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Peminjaman disetujui"
          : action === "return"
            ? "Buku dikembalikan dan ulasan diverifikasi"
            : "Peminjaman ditolak",
    })
  } catch (error) {
    console.error("Admin loan API error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    )
  }
}
