import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Pustakara",
  description: "Perpustakaan Digital",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="min-h-screen flex-1 flex flex-col">
          {/* flex-1 pada wrapper children agar konten mengisi ruang
              yang tersedia dan footer selalu ditempatkan di bawah layar. */}
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </body>
    </html>
  )
}
