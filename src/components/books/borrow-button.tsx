'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function BorrowButton() {
  const router = useRouter()

  const handleBorrow = () => {
    // TODO: Integrasikan dengan backend peminjaman nanti
    console.log("Tombol Pinjam Buku diklik")
    alert("Fitur peminjaman buku belum tersedia.")
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        className="w-full py-4 text-lg"
        onClick={handleBorrow}
      >
        Pinjam Buku
      </Button>
      <Link href="/">
        <Button variant="outline" className="w-full">
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  )
}
