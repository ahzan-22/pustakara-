import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type RouteContext = { params: Promise<{ id: string }> }

const LOAN_ACTIONS = ["approve", "reject"] as const
type LoanAction = (typeof LOAN_ACTIONS)[number]

function isLoanAction(value: unknown): value is LoanAction {
  return (
    typeof value === "string" && LOAN_ACTIONS.includes(value as LoanAction)
  )
}

/**
 * PATCH /api/admin/loans/[id]
 * Body: { action: "approve" | "reject" }
 *
 * - approve -> status 'borrowed', borrowed_at = sekarang, due_at = sekarang + 14 hari
 * - reject  -> status 'rejected'
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
        { error: "Action harus 'approve' atau 'reject'" },
        { status: 400 },
      )
    }

    // 4. Update status loan (hanya yang masih 'pending')
    const now = new Date()
    const dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const payload =
      action === "approve"
        ? {
            status: "borrowed",
            borrowed_at: now.toISOString(),
            due_at: dueAt.toISOString(),
          }
        : { status: "rejected" }

    const { data: updated, error: updateError } = await supabase
      .from("loans")
      .update(payload)
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
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

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Peminjaman disetujui"
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
