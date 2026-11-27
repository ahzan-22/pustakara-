'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface BorrowButtonProps {
  bookData: {
    id: string
    title: string
    author?: string | null
    cover?: string | null
    description?: string | null
    publishedDate?: string | null
  }
}

export function BorrowButton({ bookData }: BorrowButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: "success" | "error" | null
  }>({ text: "", type: null })

  const router = useRouter()
  const supabase = createClient()

  const handleBorrow = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push("/login")
      return
    }

    setLoading(true)
    setMessage({ text: "", type: null })

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookData: {
            id: bookData.id,
            title: bookData.title,
            author: bookData.author,
            cover: bookData.cover,
            description: bookData.description,
            publishedDate: bookData.publishedDate,
          },
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert("Buku berhasil diajukan untuk dipinjam!")
        router.push("/")
      } else {
        setMessage({ text: data.error || "Gagal mengajukan pinjaman", type: "error" })
      }
    } catch {
      setMessage({ text: "Terjadi kesalahan jaringan", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}
      <Button
        className="w-full py-4 text-lg"
        onClick={handleBorrow}
        disabled={loading}
      >
        {loading ? "Memproses…" : "Pinjam Buku"}
      </Button>
      <Link href="/">
        <Button variant="outline" className="w-full">
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  )
}
