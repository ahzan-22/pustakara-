import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Inbox, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoanActions } from "./loan-actions"

// --- Tipe data ---

type AdminLoanRow = {
  id: string
  status?: string | null
  created_at?: string | null
  borrower_name?: string | null
  books?: { title?: string | null } | null
  profiles?: { full_name?: string | null } | null
}

// --- Helper tampilan ---

function formatDate(value?: string | null): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function getBorrowerName(loan: AdminLoanRow): string {
  const name = loan.profiles?.full_name || loan.borrower_name
  if (typeof name === "string" && name.trim() !== "") return name
  return "Tidak diketahui"
}

// --- Skeleton ---

function AdminLoansFallback() {
  return (
    <main className="container mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <div className="h-8 w-96 max-w-full animate-pulse rounded-md bg-muted" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 w-full animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    </main>
  )
}

// --- Konten utama ---

async function AdminLoansContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Belum login -> halaman utama
  if (!session) {
    redirect("/")
  }

  // Cek role admin dari tabel profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/")
  }

  // Ambil peminjaman berstatus 'pending' (perlu persetujuan) dan 'borrowed'
  // (perlu konfirmasi pengembalian) + join judul buku & nama peminjam
  let loans: AdminLoanRow[] = []

  const { data: joinedData, error: joinError } = await supabase
    .from("loans")
    .select(`
      id,
      status,
      created_at,
      books ( title ),
      profiles ( full_name )
    `)
    .in("status", ["pending", "borrowed"])
    .order("created_at", { ascending: true })

  if (joinError || !joinedData) {
    // Fallback bila relasi join profiles tidak tersedia:
    // ambil loans lalu nama peminjam lewat query terpisah.
    console.error(
      "Join profiles gagal, fallback query terpisah:",
      joinError?.message,
      joinError?.code,
    )

    const { data: loanData, error: loanError } = await supabase
      .from("loans")
      .select(`
        id,
        status,
        created_at,
        user_id,
        books ( title )
      `)
      .in("status", ["pending", "borrowed"])
      .order("created_at", { ascending: true })

    if (loanError) {
      console.error("Gagal memuat peminjaman:", loanError.message, loanError.code)
    } else {
      loans = (loanData ?? []) as unknown as AdminLoanRow[]

      const userIds = Array.from(
        new Set(
          loans
            .map((loan) => (loan as unknown as { user_id?: string }).user_id)
            .filter(Boolean),
        ),
      ) as string[]

      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)

        const nameById = new Map(
          (profileRows ?? []).map((row: { id: string; full_name: string | null }) => [
            row.id,
            row.full_name,
          ]),
        )

        loans = loans.map((loan) => {
          const userId = (loan as unknown as { user_id?: string }).user_id
          return {
            ...loan,
            borrower_name: nameById.get(userId ?? "") ?? null,
          }
        })
      }
    }
  } else {
    loans = joinedData as unknown as AdminLoanRow[]
  }

  const hasPending = loans.length > 0

  return (
    <main className="container mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Admin Panel — Peminjaman Buku
          </h1>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base">
          Setujui atau tolak pengajuan peminjaman, dan konfirmasi pengembalian
          buku yang berstatus{" "}
          <span className="font-medium text-foreground">Dipinjam</span>.
        </p>
      </div>

      <div className="mt-8">
        {!hasPending ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-base font-medium">
              Tidak ada peminjaman yang perlu diproses.
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Pengajuan baru dan peminjaman aktif akan muncul di sini secara
              otomatis.
            </p>
          </div>
        ) : (
          <Card className="p-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peminjam</TableHead>
                    <TableHead>Judul Buku</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Tanggal Pengajuan
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {getBorrowerName(loan)}
                      </TableCell>
                      <TableCell className="max-w-[16rem] whitespace-normal">
                        {loan.books?.title || "Buku tidak ditemukan"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(loan.created_at)}
                      </TableCell>
                      <TableCell>
                        {loan.status === "borrowed" ? (
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-100 text-blue-800"
                          >
                            Dipinjam
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-yellow-200 bg-yellow-100 text-yellow-800"
                          >
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <LoanActions loanId={loan.id} status={loan.status} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

// --- Halaman ---

export default function AdminLoansPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="container mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Kembali ke Beranda
        </Link>
      </nav>

      <Suspense fallback={<AdminLoansFallback />}>
        <AdminLoansContent />
      </Suspense>
    </div>
  )
}
