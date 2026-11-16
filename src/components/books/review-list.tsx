import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export interface ReviewItem {
  id: string
  userName: string
  rating: number
  body: string
  isSpoiler: boolean
  isVerified: boolean
  createdAt: string | null
}

function formatDate(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function Stars({ value }: { value: number }) {
  const safe = Math.min(Math.max(value, 0), 5)
  return (
    <span
      className="text-sm tracking-tight"
      aria-label={`Rating ${safe} dari 5 bintang`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i <= safe ? "text-amber-500" : "text-muted-foreground/30"}
        >
          ★
        </span>
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const initial = review.userName.trim().charAt(0).toUpperCase() || "P"

  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-3">
        {/* Avatar + nama + badge verifikasi + tanggal */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            >
              {initial}
            </span>
            <span className="truncate font-medium">{review.userName}</span>
            <Badge variant={review.isVerified ? "default" : "secondary"}>
              {review.isVerified ? "✅ Sudah Meminjam" : "💬 Pembaca"}
            </Badge>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
          </span>
        </div>

        <Stars value={review.rating} />

        {/* Isi ulasan — disembunyikan bila spoiler, diklik untuk menampilkan */}
        {review.isSpoiler ? (
          <details className="group rounded-lg border border-border bg-muted/40 px-3 py-2">
            <summary className="cursor-pointer list-none text-sm text-muted-foreground transition-colors hover:text-foreground">
              ⚠️ Ulasan ini mengandung spoiler — klik untuk menampilkan
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {review.body}
            </p>
          </details>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {review.body}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Belum ada ulasan untuk buku ini. Jadilah yang pertama mengulas!
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li key={review.id}>
          <ReviewCard review={review} />
        </li>
      ))}
    </ul>
  )
}
