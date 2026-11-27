/**
 * Metadata buku (judul/penulis/cover/sinopsis) datang dari client dan hanya
 * dipakai untuk tampilan. Rapikan dulu sebelum masuk database: potong sesuai
 * panjang kolom, hanya izinkan URL http(s), dan buang tanggal yang tidak valid.
 */

export type BookData = {
  title?: string | null
  author?: string | null
  cover?: string | null
  description?: string | null
  publishedDate?: string | null
}

const MAX = {
  title: 255, // varchar(255)
  author: 255, // varchar(255)
  description: 5000,
  publishedDate: 40,
  cover: 2048,
  googleBooksId: 50, // varchar(50)
}

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function clipDate(value: unknown): string | null {
  const text = clip(value, MAX.publishedDate)
  if (!text) return null
  // buang string yang tidak bisa diparse jadi tanggal (new Date -> NaN)
  return Number.isNaN(new Date(text).getTime()) ? null : text
}

function safeUrl(value: unknown): string | null {
  const url = clip(value, MAX.cover)
  return url && /^https?:\/\//i.test(url) ? url : null
}

/** Rapikan seluruh metadata buku. Field yang kosong/tidak valid jadi null. */
export function sanitizeBookData(input: unknown): BookData {
  const raw = (
    input && typeof input === "object" ? input : {}
  ) as Record<string, unknown>

  return {
    title: clip(raw.title, MAX.title),
    author: clip(raw.author, MAX.author),
    cover: safeUrl(raw.cover),
    description: clip(raw.description, MAX.description),
    publishedDate: clipDate(raw.publishedDate),
  }
}

/**
 * Id volume Google Books. Wajib non-kosong dan muat di varchar(50);
 * kalau tidak, kembalikan null supaya pemanggil bisa menolak dengan 400.
 */
export function sanitizeGoogleBooksId(value: unknown): string | null {
  return clip(value, MAX.googleBooksId)
}
