"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type LoanAction = "approve" | "reject"

interface LoanActionsProps {
  loanId: string
}

/**
 * Tombol aksi admin (Setujui / Tolak) untuk satu baris peminjaman.
 * Memanggil API PATCH /api/admin/loans/[id], lalu `router.refresh()`
 * agar data tabel di Server Component ikut ter-update tanpa reload.
 */
export function LoanActions({ loanId }: LoanActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState<LoanAction | null>(null)
  const [error, setError] = useState("")

  const handleAction = async (action: LoanAction) => {
    setPending(action)
    setError("")

    try {
      const res = await fetch(`/api/admin/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        success?: boolean
      }

      if (!res.ok) {
        setError(data.error || "Gagal memproses permintaan")
        return
      }

      // Perbarui data server (tabel pending loans) secara otomatis
      router.refresh()
    } catch {
      setError("Terjadi kesalahan jaringan")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleAction("approve")}
          disabled={pending !== null}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {pending === "approve" ? "Memproses…" : "Setujui"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction("reject")}
          disabled={pending !== null}
        >
          {pending === "reject" ? "Memproses…" : "Tolak"}
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
