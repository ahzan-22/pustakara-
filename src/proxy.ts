import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Next.js Proxy (pengganti `middleware.ts` di Next 16).
 *
 * Menjalankan refresh sesi Supabase SEBELUM halaman di-render.
 * Alasannya: Next.js HANYA mengizinkan penulisan cookie di Route Handler /
 * Server Function / Proxy — bukan saat render Server Component
 * (lihat `src/lib/supabase/server.ts`).
 *
 * Dengan refresh di sini, token yang kedaluwarsa di-refresh lebih dulu lalu
 * ditulis ke `Set-Cookie` response, sehingga render halaman cukup membaca
 * cookie yang sudah segar dan tidak perlu menulis cookie lagi.
 */
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Tanpa konfigurasi Supabase, lewati proses auth.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  // Menampung hasil tulis cookie dari Supabase supaya bisa diterapkan
  // setelah request cookies diperbarui (response headers di-snapshot saat
  // NextResponse.next({ request }) dibuat).
  const writtenCookies: { name: string; value: string; options: CookieOptions }[] = []
  const writtenHeaders: Record<string, string> = {}

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Perbarui request cookies agar ikut diteruskan ke render.
          request.cookies.set(name, value)
          writtenCookies.push({ name, value, options })
        })
        Object.assign(writtenHeaders, headers)
      },
    },
  })

  // Baca sesi; bila access token kedaluwarsa, Supabase akan me-refresh-nya
  // dan hasilnya disimpan lewat setAll di atas.
  await supabase.auth.getSession()

  // Bangun response SETELAH request cookies diperbarui, lalu terapkan
  // Set-Cookie + header anti-cache yang diberikan Supabase.
  const response = NextResponse.next({ request })

  for (const { name, value, options } of writtenCookies) {
    response.cookies.set(name, value, options)
  }
  for (const [key, value] of Object.entries(writtenHeaders)) {
    response.headers.set(key, value)
  }

  return response
}

export const config = {
  // Jalankan untuk semua route kecuali aset statis.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
