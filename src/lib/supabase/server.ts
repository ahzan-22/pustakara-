import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet, headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            )
          } catch {
            // Next.js hanya mengizinkan penulisan cookie di Route Handler /
            // Server Function / Proxy — bukan saat render Server Component.
            // Refresh sesi sudah ditangani oleh `src/proxy.ts`, jadi kegagalan
            // tulis cookie di sini aman diabaikan (tidak perlu melempar error
            // yang muncul sebagai "1 Issue" di Next.js Dev Tools).
            return
          }

          // Header anti-cache (Cache-Control dll) hanya bisa diterapkan pada
          // response Route Handler; saat render Server Component diabaikan.
          void headers
        },
      },
    }
  )
}
