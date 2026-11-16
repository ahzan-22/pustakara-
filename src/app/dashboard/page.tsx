import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { connection } from "next/server"
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock3,
  Inbox,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Tipe data ---

type BookInfo = {
  title?: string | null
  author?: string | null
  cover_url?: string | null
}

type LoanRow = {
  id: string
  user_id: string
  status: string
  borrowed_at?: string | null
  created_at?: string | null
  borrower_name?: string | null
  books?: BookInfo | null
  profiles?: { full_name?: string | null } | null
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

// --- Helper tampilan ---

const STATUS_STYLES: Record<string, string> = {
  pending: "border-yellow-200 bg-yellow-100 text-yellow-800",
  approved: "border-emerald-200 bg-emerald-100 text-emerald-800",
  borrowed: "border-emerald-200 bg-emerald-100 text-emerald-800",
  rejected: "border-red-200 bg-red-100 text-red-800",
  overdue: "border-red-200 bg-red-100 text-red-800",
  returned: "border-sky-200 bg-sky-100 text-sky-800",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  borrowed: "Borrowed",
  rejected: "Rejected",
  overdue: "Overdue",
  returned: "Returned",
}

/**
 * Format tanggal peminjaman. Pakai `borrowed_at`; kalau masih kosong
 * (mis. pinjaman baru diajukan / status pending), fallback ke `created_at`.
 */
function formatDate(borrowedAt?: string | null, createdAt?: string | null): string {
  const value = borrowedAt || createdAt
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date)
}

/**
 * Lengkapi `borrower_name` untuk loan yang namanya belum didapat
 * (mis. hasil join terfilter RLS) dengan query terpisah ke tabel profiles.
 */
async function attachBorrowerNames(
  supabase: SupabaseServer,
  loans: LoanRow[],
): Promise<LoanRow[]> {
  const missingIds = Array.from(
    new Set(
      loans
        .filter((loan) => !loan.borrower_name)
        .map((loan) => loan.user_id)
        .filter(Boolean),
    ),
  )

  if (missingIds.length === 0) return loans

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", missingIds)

  if (profilesError) {
    console.error(
      "Gagal memuat data peminjam:",
      profilesError.message,
      profilesError.code,
    )
    return loans
  }

  const nameById = new Map(
    (profilesData ?? []).map((p: { id: string; full_name: string | null }) => [
      p.id,
      p.full_name,
    ]),
  )

  return loans.map((loan) => ({
    ...loan,
    borrower_name: loan.borrower_name || nameById.get(loan.user_id) || null,
  }))
}

// --- Skeleton ---

function DashboardFallback() {
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    </div>
  )
}

// --- Konten utama ---

async function DashboardContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user role + nama dari profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single()

  if (profileError) {
    console.error("Gagal memuat profil user:", profileError.message, profileError.code)
    redirect("/login")
  }

  const isAdmin = profile.role === "admin"
  let loansData: LoanRow[] = []

  if (isAdmin) {
    // Admin: Lihat SEMUA peminjaman. Utamakan join relasi langsung
    // (loans -> books, loans -> profiles) sesuai skema database.
    const { data: joinedData, error: joinError } = await supabase
      .from("loans")
      .select(`
        *,
        books (*),
        profiles (full_name)
      `)
      .order("borrowed_at", { ascending: false })

    if (joinError || !joinedData) {
      // Relasi profiles tidak tersedia (FK belum ada / kena RLS),
      // fallback: query loans biasa lalu ambil nama peminjam terpisah.
      console.error(
        "Join profiles gagal, fallback query terpisah:",
        joinError?.message,
        joinError?.code,
      )

      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          books (title, author, cover_url)
        `)
        .order("borrowed_at", { ascending: false })

      if (error) {
        console.error("Gagal memuat semua peminjaman:", error.message, error.code)
      } else {
        loansData = data ?? []
      }
    } else {
      loansData = (joinedData as LoanRow[]).map((loan) => ({
        ...loan,
        borrower_name: loan.profiles?.full_name ?? null,
      }))
    }

    // Pastikan nama peminjam terisi (menutup baris yang hasil join-nya null)
    loansData = await attachBorrowerNames(supabase, loansData)
  } else {
    // Member: Hanya peminjaman milik user tersebut
    const { data, error } = await supabase
      .from("loans")
      .select(`
        *,
        books (title, author, cover_url)
      `)
      .eq("user_id", session.user.id)
      .order("borrowed_at", { ascending: false })

    if (error) {
      console.error("Gagal memuat peminjaman user:", error.message, error.code)
    } else {
      loansData = data ?? []
    }
  }

  // --- Ringkasan (dihitung dari data yang sudah di-fetch) ---
  const totalLoans = loansData.length
  const activeLoans = loansData.filter(
    (loan) => loan.status === "approved" || loan.status === "borrowed",
  ).length
  const pendingLoans = loansData.filter(
    (loan) => loan.status === "pending",
  ).length

  const stats = [
    {
      label: "Total Buku Dipinjam",
      value: totalLoans,
      icon: BookMarked,
      tone: "bg-blue-100 text-blue-600",
    },
    {
      label: "Sedang Dipinjam",
      value: activeLoans,
      icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Menunggu Persetujuan",
      value: pendingLoans,
      icon: Clock3,
      tone: "bg-yellow-100 text-yellow-600",
    },
  ]

  // Nama dari tabel profiles; placeholder 'Pengguna Baru' (diisi trigger saat
  // metadata kosong) atau nilai kosong dianggap belum ada, lalu fallback email.
  const profileName =
    typeof profile.full_name === "string" ? profile.full_name.trim() : ""
  const hasRealName = profileName !== "" && profileName !== "Pengguna Baru"
  const userName = hasRealName ? profileName : session.user.email || "Pengguna"

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Sapaan */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Halo, {userName} 👋
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Berikut adalah ringkasan peminjaman buku Anda.
        </p>
        {isAdmin && (
          <p className="mt-1 text-xs text-muted-foreground">
            Anda login sebagai <span className="font-medium text-foreground">Admin</span> —
            menampilkan semua peminjaman dari seluruh user.
          </p>
        )}
      </div>

      {/* Kartu ringkasan */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}
              >
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daftar peminjaman */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Daftar Peminjaman
        </h2>

        {loansData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-base font-medium">Belum ada peminjaman. Yuk cari buku!</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Semua buku yang Anda ajukan untuk dipinjam akan muncul di sini.
            </p>
            <Button asChild className="mt-2">
              <Link href="/">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Cari Buku
              </Link>
            </Button>
          </div>
        ) : (
          <Card className="p-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Cover</TableHead>
                    <TableHead>Judul &amp; Penulis</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Tanggal Pinjam
                    </TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Peminjam</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loansData.map((loan) => {
                    const statusKey = String(loan.status ?? "pending")
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="py-3">
                          {loan.books?.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={loan.books.cover_url}
                              alt={loan.books?.title || "Cover buku"}
                              className="h-14 w-10 rounded-md object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="flex h-14 w-10 items-center justify-center rounded-md bg-muted ring-1 ring-border">
                              <BookOpen
                                className="h-5 w-5 text-muted-foreground"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[16rem] whitespace-normal">
                          <p className="font-medium leading-snug">
                            {loan.books?.title || "Buku tidak ditemukan"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {loan.books?.author || "Penulis tidak diketahui"}
                          </p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(loan.borrowed_at, loan.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={STATUS_STYLES[statusKey] ?? STATUS_STYLES.pending}
                          >
                            {STATUS_LABELS[statusKey] ?? statusKey}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="whitespace-nowrap font-medium">
                            {loan.profiles?.full_name ||
                              loan.borrower_name ||
                              "Tidak diketahui"}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="container mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Kembali ke Beranda
        </Link>
      </nav>

      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
