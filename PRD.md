# Product Requirements Document (PRD)
# Pustaka — Perpustakaan Digital Komunitas

**Document Control**

| Field | Value |
|-------|-------|
| **Nama Produk** | Pustaka |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 2 November 2026 |
| **Status** | Draft — Disetujui untuk Eksekusi |
| **Tim** | 1 orang (Solo Developer) |
| **Durasi** | 4 minggu (20 hari kerja efektif) |
| **Target Rilis** | Akhir November 2026 (Vercel Production) |

---

## 1. Executive Summary

Pustaka adalah aplikasi web perpustakaan digital komunitas yang memungkinkan pengguna menemukan, meminjam, mengulas, dan mengoleksi buku secara online. Berbeda dari katalog perpustakaan biasa, Pustaka menerapkan sistem ulasan terverifikasi (hybrid review) — ulasan dari anggota yang benar-benar sudah meminjam buku diberi label dan bobot berbeda dari ulasan pembaca umum. Pendekatan ini meningkatkan kepercayaan pengguna terhadap kualitas rekomendasi buku.

**Visi:** Menjadi perpustakaan digital yang tidak hanya menyimpan buku, tetapi juga membangun kepercayaan antar pembaca.

**Rilis 1.0 (MVP)** berfokus pada alur inti: temukan buku → pinjam → kembalikan → ulas. Fitur komunitas dan analitik lanjutan ditunda ke rilis berikutnya.

---

## 2. Latar Belakang & Masalah

### 2.1 Masalah Pengguna

| Persona | Masalah |
|---------|---------|
| **Pembaca** | Sulit menemukan buku berkualitas karena ulasan online sering tidak kredibel (belum baca tapi mengulas). |
| **Pembaca** | Tidak tahu buku mana yang tersedia di perpustakaan komunitas dan bagaimana cara meminjamnya. |
| **Pengelola perpustakaan** | Pencatatan peminjaman masih manual (buku tulis/spreadsheet), ravan hilang dan sulit dilacak. |
| **Pengelola** | Tidak punya data tentang buku populer, anggota aktif, atau tingkat keterlambatan. |

### 2.2 Peluang

- Perpustakaan komunitas (RT/RW, sekolah, kampus, kantor) banyak yang belum punya sistem digital.
- Ulasan buku di platform besar (Goodreads, Gramedia) tidak membedakan pembaca nyata vs pembaca kasual.
- Tidak ada platform perpustakaan yang fokus pada kepercayaan ulasan.

### 2.3 Mengapa Sekarang

Proyek ini dikerjakan sebagai bagian dari program pengembangan web (1 bulan). Stack modern (Next.js + Supabase + Vercel) memungkinkan solo developer membangun dan deploy aplikasi full-stack dalam waktu terbatas tanpa biaya infrastruktur.

---

## 3. Tujuan & Metrik Keberhasilan

### 3.1 Tujuan Produk (Goals)

- Menyediakan katalog buku yang bisa dicari, difilter, dan dijelajeli.
- Memungkinkan anggota meminjam buku dengan alur approval yang jelas.
- Menerapkan sistem ulasan hybrid (terverifikasi + pembaca) yang membedakan Pustaka dari katalog biasa.
- Memberi pengelola perpustakaan dashboard untuk mengelola buku, peminjaman, anggota, dan ulasan.
- Deploy ke production dan dapat diakses publik.

### 3.2 Metrik Keberhasilan (Success Metrics)

| Metrik | Target MVP |
|--------|------------|
| Halaman utama dapat diakses publik | ✅ Live di Vercel |
| Alur register → pinjam → kembali → ulas | ✅ Berjalan end-to-end tanpa error |
| Ulasan terverifikasi muncul otomatis setelah pengembalian | ✅ 100% akurat |
| Waktu muat halaman katalog | < 2 detik (LCP) |
| Responsive di mobile (≥ 375px) | ✅ Semua halaman |
| Seed data siap demo | ≥ 30 buku, 5 user, 20 ulasan, 10 peminjaman |
| Test coverage alur kritis | 3 skenario e2e lulus |

### 3.3 Non-Goals (Tidak Termasuk di MVP)

- ❌ Pembayaran online / denda terintegrasi payment gateway
- ❌ Notifikasi email/push (hanya in-app)
- ❌ Aplikasi mobile native
- ❌ Multi-tenant (satu instance = satu perpustakaan)
- ❌ Rekomendasi berbasis ML/AI
- ❌ Chat antar anggota
- ❌ Scan barcode fisik (ISBN manual input dulu)
- ❌ Integrasi Open Library API (ditunda ke v1.1)

---

## 4. Target Pengguna & Persona

### 4.1 Persona Utama

👤 **Persona 1: Andi — Pembaca Aktif (Anggota)**
- Usia: 22 tahun, mahasiswa
- Tujuan: Menemukan buku bagus, meminjam tanpa ribet, membaca ulasan kredibel
- Frustrasi: Ulasan di internet tidak bisa dipercaya; tidak tahu buku tersedia atau tidak
- Kebutuhan: Katalog yang bisa difilter, status ketersediaan real-time, ulasan dari pembaca nyata

👤 **Persona 2: Sari — Pengelola Perpustakaan (Admin/Pustakawan)**
- Usia: 35 tahun, pengurus komunitas
- Tujuan: Mengelola koleksi buku dan peminjaman tanpa buku tulis
- Frustrasi: Pencatatan manual, sulit tahu siapa telat mengembalikan
- Kebutuhan: Dashboard admin, approval peminjaman, notifikasi keterlambatan

👤 **Persona 3: Budi — Pengunjung (Belum Login)**
- Usia: 19 tahun, calon anggota
- Tujuan: Melihat-lihat katalog sebelum mendaftar
- Frustrasi: Web perpustakana yang harus login dulu baru bisa lihat isi
- Kebutuhan: Katalog publik yang bisa dijelajahi tanpa login

### 4.2 Peran dalam Sistem

| Peran | Deskripsi | Hak Akses |
|-------|-----------|-----------|
| **Guest** | Belum login | Lihat katalog, detail buku, ulasan |
| **Member** | Anggota terdaftar | Semua guest + pinjam, wishlist, review, notifikasi, profil |
| **Librarian** | Pustakawan | Semua member + approve pinjam, kelola buku, moderasi review |
| **Admin** | Pengelola penuh | Semua librarian + kelola anggota, ubah role, analytics |

*Catatan MVP: Librarian dan Admin bisa digabung jadi satu role admin untuk menyederhanakan. Pemisahan role detail ditunda ke v1.1.*

---

## 5. Lingkup Produk (Scope)

### 5.1 In Scope — Rilis 1.0

#### Modul A — Katalog & Penemuan

- Landing page dengan search, kategori populer, buku terbaru, buku terpopuler
- Halaman katalog dengan filter (kategori, tahun, rating, status), search, sort, pagination
- Halaman detail buku: cover, metadata, sinopsis, status stok, ulasan, buku serupa

#### Modul B — Autentikasi & Profil

- Register (email/password), login, logout
- Google OAuth (opsional, kalau waktu cukup)
- Halaman profil: avatar, bio, statistik, edit profil

#### Modul C — Peminjaman

- Ajukan pinjam (dari detail buku atau wishlist)
- Status: pending → approved → borrowed → returned (atau rejected/overdue)
- Perpanjangan (1x, +7 hari)
- Pengembalian
- Denda otomatis (Rp 1.000/hari telat)
- Reservasi kalau stok habis (antrian)

#### Modul D — Wishlist

- Tambah/hapus buku dari wishlist
- Halaman wishlist dengan tombol pinjam langsung

#### Modul E — Ulasan Hybrid (Opsi C + Aturan A) ⭐

- Semua member bisa menulis ulasan (rating 1–5 + komentar 10–1000 karakter)
- **Label otomatis:**
  - ✅ **Sudah meminjam** — jika user pernah meminjam buku diberi label dan bobot berbeda dari ulasan pembaca umum
  - 💬 **Pembaca** — jika belum pernah meminjam
- **Aturan A:** User yang sedang meminjam boleh menulis ulasan (label 💬 Pembaca), lalu otomatis naik jadi ✅ Sudah meminjam setelah buku dikembalikan
- 1 ulasan per buku per user (bisa diedit, tidak ditambah)
- Spoiler tag (opsional)
- Like/dislike ulasan
- Laporkan ulasan
- Distribusi rating per bintang
- Filter/sort ulasan (terbaru, terverifikasi dulu, rating tertinggi)

#### Modul F — Notifikasi

- In-app notification: peminjaman disetujui/ditolak, jatuh tempo, reservasi tersedia, ulasan di-like, ulasan dihapus
- Badge jumlah belum dibaca

#### Modul G — Admin Dashboard

- Statistik: total buku, anggota aktif, peminjaman aktif, menunggu approval
- CRUD buku (tambah, edit, hapus, upload cover)
- CRUD kategori
- Approve/reject peminjaman, tandai kembali
- Kelola anggota (lihat, ubah role, suspend)
- Moderasi ulasan (daftar dilaporkan, hapus, sembunyikan)
- Activity log

#### Modul H — Sistem & Infrastruktur

- Row Level Security (RLS) di Supabase
- Seed data (30 buku, 5 user, 20 ulasan, 10 peminjaman)
- README lengkap
- Deploy Vercel + Supabase production
- Error monitoring (Sentry free tier, opsional)

### 5.2 Out of Scope — Ditunda ke v1.1+

- Payment gateway, denda online
- Notifikasi email/push
- Aplikasi mobile native
- ISBN scanner / Open Library API
- Reading list publik
- Analytics lanjutan (grafik, export)
- Chat antar anggota
- Rekomendasi ML
- Multi-tenant
- Dark mode (opsional, kalau waktu cukup)

---

## 6. User Stories

### 6.1 Guest

| ID | Story | Prioritas |
|----|-------|-----------|
| US-G1 | Sebagai guest, saya ingin melihat katalog buku tanpa login | Must |
| US-G2 | Sebagai guest, saya ingin mencari buku berdasarkan judul/penulis | Must |
| US-G3 | Sebagai guest, saya ingin melihat detail buku dan ulasannya | Must |
| US-G4 | Sebagai guest, saya ingin mendaftar akun | Must |
| US-G5 | Sebagai guest, saya ingin login ke akun saya | Must |

### 6.2 Member

| ID | Story | Prioritas |
|----|-------|-----------|
| US-M1 | Sebagai member, saya ingin meminjam buku | Must |
| US-M2 | Sebagai member, saya ingin melihat buku yang sedang saya pinjam | Must |
| US-M3 | Sebagai member, saya ingin memperpanjang peminjaman | Should |
| US-M4 | Sebagai member, saya ingin mengembalikan buku | Must |
| US-M5 | Sebagai member, saya ingin menyimpan buku ke wishlist | Should |
| US-M6 | Sebagai member, saya ingin menulis ulasan dengan rating | Must |
| US-M7 | Sebagai member, saya ingin melihat label "Sudah meminjam" di ulasan saya setelah buku dikembalikan | Must |
| US-M8 | Sebagai member, saya ingin mengedit ulasan saya | Must |
| US-M9 | Sebagai member, saya ingin menandai ulasan mengandung spoiler | Should |
| US-M10 | Sebagai member, saya ingin melaporkan ulasan yang tidak pantas | Should |
| US-M11 | Sebagai member, saya ingin mendapat notifikasi saat peminjaman disetujui | Must |
| US-M12 | Sebagai member, saya ingin mengedit profil saya | Should |
| US-M13 | Sebagai member, saya ingin reservasi buku yang stoknya habis | Could |

### 6.3 Admin

| ID | Story | Prioritas |
|----|-------|-----------|
| US-A1 | Sebagai admin, saya ingin menambah buku baru | Must |
| US-A2 | Sebagai admin, saya ingin mengedit dan menghapus buku | Must |
| US-A3 | Sebagai admin, saya ingin mengunggah cover buku | Must |
| US-A4 | Sebagai admin, saya ingin menyetujui/menolak peminjaman | Must |
| US-A5 | Sebagai admin, saya ingin menandai buku sudah dikembalikan | Must |
| US-A6 | Sebagai admin, saya ingin melihat daftar anggota | Should |
| US-A7 | Sebagai admin, saya ingin mengubah role anggota | Should |
| US-A8 | Sebagai admin, saya ingin menghapus ulasan yang melanggar | Must |
| US-A9 | Sebagai admin, saya ingin melihat statistik peminjaman | Should |
| US-A10 | Sebagai admin, saya ingin melihat activity log | Could |

---

## 7. Functional Requirements

### 7.1 Modul A — Katalog & Penemuan

**FR-A1: Landing Page**
- Menampilkan hero + search bar besar
- Menampilkan 6 kategori populer
- Menampilkan 8 buku terbaru (berdasarkan created_at)
- Menampilkan 8 buku terpopuler (berdasarkan jumlah peminjaman 30 hari terakhir)
- Menampilkan statistik: total buku, total anggota, total peminjaman
- Footer: tautan Tentang, Kontak, GitHub

**FR-A2: Halaman Katalog**
- Grid buku dengan cover, judul, penulis, rating rata-rata, badge status (Tersedia/Habis)
- Sidebar filter:
  - Kategori (multi-select)
  - Tahun terbit (range)
  - Rating (multi-select: 5★, 4★, dst.)
  - Status ketersediaan (tersedia/habis)
- Search bar (judul, penulis, ISBN)
- Sort: terbaru, terpopuler, rating tertinggi, judul A–Z
- Pagination (12 buku per halaman) atau infinite scroll
- Responsive: filter jadi drawer di mobile

**FR-A3: Halaman Detail Buku**
- Cover besar, judul, penulis, tahun, penerbit
- Rating rata-rata + jumlah ulasan
- Status ketersediaan (X dari Y salinan tersedia)
- **Tombol aksi:**
  - Pinjam (jika tersedia & login)
  - Reservasi (jika habis & login)
  - Wishlist (toggle, jika login)
  - Masuk untuk meminjam (jika belum login)
- Sinopsis
- Metadata: ISBN, jumlah halaman, bahasa, tag
- Section ulasan (lihat FR-E5)
- Section buku serupa (berdasarkan kategori + tag yang sama, maks 5)

### 7.2 Modul B — Autentikasi & Profil

**FR-B1: Register**
- Field: nama lengkap, email, password (min 8 karakter)
- Validasi email format & uniqueness
- Setelah register → auto-login → redirect ke halaman sebelumnya
- Email verification: opsional (bisa ditunda untuk MVP)

**FR-B2: Login**
- Email + password
- Google OAuth (opsional)
- Lupa password via reset link (Supabase built-in)
- Redirect ke halaman sebelumnya setelah login

**FR-B3: Profil**
- Tampilkan: avatar, nama, email, bio, tanggal bergabung
- Statistik: total dipinjam, total ulasan, total wishlist
- Buku favorit (buku yang diberi rating 5)
- Form edit: nama, bio, avatar (upload)

### 7.3 Modul C — Peminjaman

**FR-C1: Ajukan Peminjaman**
- Trigger: klik Pinjam di detail buku atau wishlist
- **Syarat:**
  - User login sebagai member
  - Stok tersedia (available_copies > 0)
  - User tidak sedang meminjam buku yang sama
- **Aksi:**
  - Buat record loans dengan status pending
  - Kurangi available_copies sementara (atau tunggu approval — keputusan: kurangi saat approval)
  - Notifikasi ke admin (opsional)
  - Tampilkan toast: "Peminjaman diajukan, menunggu approval"

**FR-C2: Approval Peminjaman (Admin)**
- Admin melihat daftar pending di dashboard
- Approve → status approved, borrowed_at = now(), due_at = now() + 14 hari, kurangi available_copies
- Reject → status rejected, isi alasan
- Notifikasi ke user

**FR-C3: Daftar Buku Dipinjam (Member)**
- Tampilkan buku dengan status approved atau borrowed atau overdue
- Tampilkan tanggal pinjam, jatuh tempo, sisa hari
- Tombol Perpanjang (jika belum diperpanjang, +7 hari)
- Tombol Kembalikan (hanya menandai request; actual return oleh admin)

**FR-C4: Pengembalian**
- Keputusan: member klik "Ajukan Pengembalian", admin konfirmasi "Buku Diterima"
- Setelah admin konfirmasi:
  - returned_at = now(), status returned
  - Tambah available_copies
  - Hitung denda jika returned_at > due_at: denda = (hari_telat) × Rp 1.000
  - Trigger verifikasi ulasan (lihat FR-E4)
- Notifikasi ke user

**FR-C5: Deteksi Overdue**
- Cron harian: cek loans dengan due_at < now() dan status borrowed → ubah ke overdue
- Kirim notifikasi ke user: "Buku X terlambat Y hari"

**FR-C6: Reservasi (Opsional untuk MVP)**
- Jika stok habis, user bisa reservasi → masuk antrian
- Saat stok tersedia, user pertama di antrian dapat notifikasi

### 7.4 Modul D — Wishlist

- Toggle tambah/hapus dari detail buku
- Halaman /wishlist menampilkan grid buku
- Tombol pinjam/reservasi langsung dari wishlist
- Empty state: "Belum ada buku di wishlist. Yuk jelajahi katalog."

### 7.5 Modul E — Ulasan Hybrid ⭐ (Fitur Pembeda)

**FR-E1: Siapa yang Boleh Menulis Ulasan**
- Semua member login boleh menulis ulasan (aturan Opsi C)
- Guest: tombol "Masuk untuk mengulas"
- 1 ulasan per buku per user (unique constraint (user_id, book_id))

**FR-E2: Form Ulasan**
- **Field:**
  - Rating (wajib, 1–5 bintang)
  - Komentar (wajib, 10–1000 karakter)
  - Spoiler checkbox (opsional)
- **Label info (otomatis, tidak bisa diubah user):**
  - ✅ Kamu sudah meminjam buku ini — jika is_verified = true
  - 💬 Kamu mengulas sebagai pembaca — jika is_verified = false
- Mode edit: jika sudah ada ulasan, form berubah jadi edit

**FR-E3: Aturan Label Verifikasi (Opsi C + Aturan A)**
- **Definisi is_verified = true:**
  - User pernah meminjam buku ini dan sudah mengembalikannya (loans.status = 'returned' untuk user_id + book_id yang sama)
- **Saat create review:**
  ```text
  if (ada loans dengan user_id, book_id, status='returned'):
      is_verified = true
  else:
      is_verified = false   # termasuk jika sedang pinjam (status='borrowed')
  ```
- **Saat buku dikembalikan (trigger):**
  ```text
  Untuk setiap review user X untuk buku Y:
      jika ada loans X-Y dengan status='returned':
          set is_verified = true
  ```
- **Konsekuensi Aturan A:**
  - User yang sedang meminjam (status borrowed) boleh menulis ulasan → label 💬 Pembaca
  - Setelah buku dikembalikan → label otomatis berubah jadi ✅ Sudah meminjam
  - User tidak perlu edit manual

**FR-E4: Trigger Verifikasi Otomatis**
- **Event:** admin konfirmasi pengembalian (loans.status → returned)
- **Aksi:**
  - Query semua reviews milik user tersebut untuk buku tersebut
  - Update is_verified = true untuk semua review yang cocok
  - Log di activity_logs: action='review_auto_verified'
- **Implementasi:** Supabase Edge Function atau API route yang dipanggil dari endpoint pengembalian (bukan database trigger, agar logic terlihat di kode)

**FR-E5: Tampilan Ulasan di Detail Buku**
- Header: rating rata-rata (dengan bobot), jumlah ulasan
- Distribusi rating: bar chart per bintang (5★: 20, 4★: 8, dst.)
- **Tab filter:** Semua / ✅ Terverifikasi / 💬 Pembaca
- Sort: Terverifikasi dulu (default) / Terbaru / Rating tertinggi / Rating terendah
- **Setiap ulasan menampilkan:**
  - Avatar + nama + tanggal
  - Rating bintang
  - Badge verifikasi (✅ Sudah meminjam atau 💬 Pembaca)
  - Isi ulasan (disembunyikan jika spoiler — klik untuk lihat)
  - Tombol like/dislike (dengan counter)
  - Tombol laporkan
  - Tombol edit (jika milik sendiri)

**FR-E6: Perhitungan Rating Rata-Rata (Berbobot)**
```text
bobot_verified = 2
bobot_unverified = 1

rating_rata_rata = 
    (sum(rating × bobot) untuk semua review published) 
    / (sum(bobot))
```
Hanya review dengan status = 'published' yang dihitung.

**FR-E7: Edit Ulasan**
- User bisa edit rating, komentar, spoiler
- is_verified tidak berubah saat edit (kalau sudah verified, tetap verified)
- updated_at di-update
- Tidak bisa menghapus ulasan sendiri (hanya admin yang bisa hapus/sembunyikan)

**FR-E8: Like/Dislike Ulasan**
- User login bisa like (+1) atau dislike (-1) ulasan orang lain
- Tidak bisa vote ulasan sendiri
- Bisa ganti vote (like → dislike → hapus vote)
- Counter like_count di-update

**FR-E9: Laporkan Ulasan**
- Tombol Laporkan di tiap ulasan
- Form: alasan (spam, kasar, SARA, tidak relevan, lainnya)
- Masuk ke antrian moderasi admin (review_reports table dengan status pending)

**FR-E10: Moderasi Ulasan (Admin)**
- Halaman /admin/reviews
- Tab: Dilaporkan (N) / Semua / Terverifikasi / Pembaca
- **Aksi per ulasan:**
  - Sembunyikan → status = 'hidden' (tidak muncul publik, tapi tidak dihapus)
  - Hapus → status = 'deleted' (soft delete)
  - Abaikan laporan → report status dismissed
- Isi alasan moderasi (wajib untuk hapus/sembunyikan)
- Notifikasi ke user pemilik ulasan jika dihapus/disembunyikan
- Catat di activity_logs

### 7.6 Modul F — Notifikasi

**FR-F1: Tipe Notifikasi**

| Tipe | Trigger | Penerima |
|------|---------|----------|
| loan_approved | Admin approve pinjam | Member |
| loan_rejected | Admin reject pinjam | Member |
| due_soon | H-3 sebelum jatuh tempo | Member |
| overdue | H+1 setelah jatuh tempo | Member |
| return_confirmed | Admin konfirmasi pengembalian | Member |
| review_verified | Ulasan otomatis jadi terverifikasi | Member |
| review_liked | Ulasan user dapat like | Member |
| review_hidden | Admin hapus/sembunyikan ulasan | Member |
| reservation_ready | Stok tersedia untuk reservasi | Member |

**FR-F2: UI Notifikasi**
- Ikon 🔔 di navbar dengan badge angka belum dibaca
- Dropdown menampilkan 10 notifikasi terbaru
- Halaman /notifications untuk semua
- Tombol "Tandai semua sudah dibaca"

### 7.7 Modul G — Admin Dashboard

**FR-G1: Dashboard Statistik**
- Kartu: total buku, anggota aktif (login 30 hari), peminjaman aktif, menunggu approval
- Grafik peminjaman 30 hari terakhir (line chart)
- Top 5 buku terpopuler (berdasarkan jumlah pinjam 30 hari)
- Activity log 10 terbaru

**FR-G2: CRUD Buku**
- Tabel: cover, judul, penulis, stok, status, aksi
- Search + filter kategori
- Form tambah/edit: semua field buku + upload cover
- Hapus: soft delete atau konfirmasi (jika ada peminjaman aktif, tidak boleh hapus)
- Export CSV / Import CSV (opsional)

**FR-G3: Kelola Peminjaman**
- Tab: Menunggu / Aktif / Terlambat / Selesai
- Aksi: Setujui, Tolak (dengan alasan), Tandai Kembali
- Filter: user, buku, tanggal

**FR-G4: Kelola Anggota**
- Tabel: nama, email, role, tanggal bergabung, status
- Detail anggota: riwayat pinjam, ulasan, wishlist
- Aksi: ubah role, suspend/aktifkan

**FR-G5: Moderasi Ulasan**
- Lihat FR-E10

**FR-G6: Activity Log**
- Tabel: waktu, aktor, aksi, entitas, metadata
- Filter: aktor, aksi, tanggal

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Waktu muat halaman katalog: LCP < 2 detik (di koneksi 4G)
- API response time: < 500ms (p95)
- Pagination wajib untuk list > 20 item
- Gambar cover di-optimize (Next.js Image component, WebP, lazy load)

### 8.2 Security
- Semua API route memvalidasi input dengan Zod
- Row Level Security (RLS) aktif di semua tabel Supabase
- Password di-handle oleh Supabase Auth (bukan custom)
- Environment variables tidak di-commit (.env.example disediakan)
- Rate limiting pada endpoint auth (Supabase built-in)
- File upload dibatasi ukuran (max 2 MB) dan tipe (image/jpeg, image/png, image/webp)

### 8.3 Reliability
- Error handling global dengan toast notification
- Fallback UI untuk error state (ErrorBoundary)
- Sentry untuk error monitoring (free tier)

### 8.4 Accessibility
- Semantic HTML (<button>, <nav>, <main>)
- Alt text untuk semua gambar
- aria-label untuk ikon button
- Kontras warna WCAG AA
- Keyboard navigable (tab order, focus state)

### 8.5 Responsiveness
- Mobile: 375px – 767px
- Tablet: 768px – 1023px
- Desktop: ≥ 1024px
- Semua halaman harus usable di 3 ukuran

### 8.6 Browser Support
- Chrome/Edge (2 versi terakhir)
- Firefox (2 versi terakhir)
- Safari (2 versi terakhir)

### 8.7 SEO
- <title> dan meta description per halaman
- Open Graph tags untuk sharing
- Sitemap.xml (opsional)

---

## 9. Data Model

### 9.1 Entity Relationship (ringkasan)

```
profiles ────┬── loans ──────── books ──── categories
             ├── reviews ──────┘   │
             ├── wishlists ────────┤
             ├── reservations ─────┤
             ├── notifications     │
             ├── review_votes ─────┤
             ├── review_reports ───┤
             └── activity_logs     │
                                    └── book_tags ──── tags
```

### 9.2 Tabel Utama

#### profiles
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | uuid PK | references auth.users(id) |
| full_name | text | not null |
| avatar_url | text | nullable |
| bio | text | nullable |
| role | text | admin | librarian | member (default member) |
| status | text | active | suspended (default active) |
| created_at | timestamptz | default now() |

#### categories
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | serial PK | |
| name | text | unique |
| slug | text | unique |

#### books
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | uuid PK | default gen_random_uuid() |
| title | text | not null |
| author | text | not null |
| isbn | text | unique, nullable |
| publisher | text | nullable |
| year | int | nullable |
| synopsis | text | nullable |
| cover_url | text | nullable |
| category_id | int | FK references categories |
| total_copies | int | default 1 |
| available_copies | int | default 1 |
| deleted_at | timestamptz | soft delete |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

#### tags & book_tags
- tags: id, name (unique)
- book_tags: (book_id, tag_id) PK

#### loans
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | uuid PK | |
| user_id | uuid FK | references profiles |
| book_id | uuid FK | references books |
| borrowed_at | timestamptz | diisi saat approved |
| due_at | timestamptz | borrowed_at + 14 hari |
| returned_at | timestamptz | nullable |
| extended | boolean | default false |
| status | text | pending | approved | rejected | borrowed | returned | overdue |
| fine_amount | int | default 0 (dalam rupiah) |
| approved_by | uuid FK | references profiles |
| notes | text | alasan reject |
| created_at | timestamptz | default now() |

#### reservations
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | uuid PK | |
| user_id | uuid FK | |
| book_id | uuid FK | |
| status | text | waiting | fulfilled | cancelled |
| created_at | timestamptz | |

#### reviews ⭐
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | uuid PK | |
| user_id | uuid FK | references profiles |
| book_id | uuid FK | references books |
| rating | int | check 1–5 |
| body | text | check length 10–1000 |
| is_spoiler | boolean | default false |
| is_verified | boolean | default false |
| like_count | int | default 0 |
| status | text | published | hidden | deleted (default published) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| UNIQUE (user_id, book_id) | | 1 review per user per book |

#### review_votes
| Kolom | Tipe | Catatan |
|-------|------|---------|
| review_id | uuid FK | |
| user_id | uuid FK | |
| vote | int | check (-1, 1) |
| PK (review_id, user_id) | | |

#### review_reports
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | uuid PK | |
| review_id | uuid FK | |
| reporter_id | uuid FK | |
| reason | text | |
| status | text | pending | resolved | dismissed |
| created_at | timestamptz | |

#### wishlists
| Kolom | Tipe | Catatan |
|-------|------|---------|
| user_id | uuid FK | |
| book_id | uuid FK | |
| created_at | timestamptz | |
| PK (user_id, book_id) | | |

#### notifications
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | uuid PK | |
| user_id | uuid FK | |
| type | text | lihat FR-F1 |
| title | text | |
| body | text | |
| link | text | URL tujuan |
| read | boolean | default false |
| created_at | timestamptz | |

#### activity_logs
| Kolom | Tipe | Catatan |
|-------|------|---------|
| id | bigserial PK | |
| actor_id | uuid FK | nullable (system) |
| action | text | e.g. book_created, review_hidden |
| entity | text | e.g. book, review |
| entity_id | text | |
| metadata | jsonb | |
| created_at | timestamptz | |

### 9.3 Row Level Security (RLS) Policies

| Tabel | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | semua | auth (self) | self | none |
| books | semua | admin | admin | admin (soft) |
| loans | self + admin | self (create) | admin (status), self (extend) | none |
| reviews | published | auth | self (own) | admin (soft) |
| review_votes | self | auth | self | self |
| wishlists | self | self | none | self |
| notifications | self | system | self | none |
| activity_logs | admin | system | none | none |

---

## 10. Information Architecture & Routes

| Route | Deskripsi |
|-------|-----------|
| / | Landing page |
| /books | Katalog |
| /books/[id] | Detail buku |
| /search | (opsional — bisa digabung ke /books) |
| /login | Login |
| /register | Register |
| /forgot-password | Lupa password |
| /dashboard | Dashboard member |
| /dashboard/loans | Buku dipinjam + riwayat |
| /dashboard/reviews | Ulasan saya |
| /wishlist | Wishlist |
| /profile | Profil |
| /notifications | Notifikasi |
| /admin | Admin dashboard |
| /admin/books | Kelola buku |
| /admin/books/new | Tambah buku |
| /admin/books/[id]/edit | Edit buku |
| /admin/categories | Kelola kategori |
| /admin/loans | Kelola peminjaman |
| /admin/members | Kelola anggota |
| /admin/reviews | Moderasi ulasan |
| /admin/activity | Activity log |

---

## 11. Design Principles

- **Content-first** — cover buku dan informasi adalah bintang utama, bukan dekorasi.
- **Trust visible** — label verifikasi harus jelas dan terlihat di setiap ulasan.
- **Low friction** — pinjam buku maksimal 2 klik dari detail buku.
- **Mobile-friendly** — semua alur bisa diselesaikan di HP.
- **Feedback always** — setiap aksi (pinjam, wishlist, review) memberi feedback (toast, loading, success/error).
- **Empty state friendly** — setiap list kosong punya pesan yang mengarahkan.

**Referensi visual:** Goodreads (layout katalog), Vercel dashboard (kebersihan), Linear (tipografi).

**Design system:** Tailwind CSS + shadcn/ui. Warna primer: indigo/blue. Font: Inter.

---

## 12. Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Framework | Next.js 14 (App Router) + TypeScript | Full-stack, SSR, deploy mudah |
| UI | Tailwind CSS + shadcn/ui | Cepat, konsisten, aksesibel |
| Database | Supabase (Postgres) | Cloud, gratis, RLS built-in |
| Auth | Supabase Auth | Email + Google OAuth, aman |
| Storage | Supabase Storage | Cover, avatar |
| ORM | Drizzle ORM | Type-safe, migrasi rapi |
| Validasi | Zod | Validasi server-side |
| Form | React Hook Form + Zod | Standar industri |
| State/Data | TanStack Query | Cache, refetch, loading state |
| Deploy | Vercel | Push → deploy otomatis |
| Error Monitoring | Sentry (free) | Opsional |
| Testing | Vitest (unit), Playwright (e2e) | 3 skenario e2e |
| CI | GitHub Actions | Lint + typecheck |
| Development environment | GitHub Codespaces (karena laptop jadul) atau VS Code lokal + browser. |

**Biaya:** Rp 0 (semua free tier).

---

## 13. Timeline & Milestones (Solo Developer, 4 Minggu)

### Minggu 1 — Fondasi & Katalog Read-Only

| Hari | Deliverable |
|------|-------------|
| 1 | Setup Next.js + Supabase + Drizzle + repo + Vercel deploy awal |
| 2 | Skema database + migrasi + RLS policies + seed data 30 buku |
| 3 | Supabase Auth (register, login, logout) + halaman profil dasar |
| 4 | Landing page + halaman katalog (read-only) + detail buku (tanpa review) |
| 5 | Filter, search, sort, pagination + polish UI |
| **Milestone M1:** | Katalog publik live di Vercel, user bisa register/login. |

### Minggu 2 — Peminjaman & Admin CRUD

| Hari | Deliverable |
|------|-------------|
| 6 | Admin CRUD buku (tambah, edit, hapus, upload cover) |
| 7 | Ajukan peminjaman + approval admin + kurangi stok |
| 8 | Halaman "buku saya" + pengembalian + denda otomatis |
| 9 | Perpanjangan + deteksi overdue (cron) + notifikasi in-app dasar |
| 10 | Wishlist + polish UI admin |
| **Milestone M2:** | Alur pinjam-meminjam end-to-end berjalan. |

### Minggu 3 — Ulasan Hybrid ⭐ (Fitur Pembeda)

| Hari | Deliverable |
|------|-------------|
| 11 | Tabel reviews, review_votes, review_reports + API create/edit/delete |
| 12 | Logic is_verified saat create + form ulasan (create/edit mode) |
| 13 | Tampilan ulasan di detail buku: badge, distribusi, sort, filter tab |
| 14 | Trigger verifikasi otomatis saat pengembalian + notifikasi review_verified |
| 15 | Like/dislike + laporkan ulasan + halaman moderasi admin |
| **Milestone M3:** | Sistem ulasan hybrid berjalan end-to-end. |

### Minggu 4 — Polish, Testing, Deploy

| Hari | Deliverable |
|------|-------------|
| 16 | Notifikasi lengkap (semua tipe) + halaman notifikasi |
| 17 | Admin dashboard statistik + activity log + kelola anggota |
| 18 | Testing e2e (3 skenario) + fix bug + error handling global |
| 19 | Seed data final + README + Postman collection + Sentry |
| 20 | Deploy production + demo video 3 menit + slide presentasi |
| **Milestone M4:** | Rilis 1.0 live di production. |

**Buffer & Risiko Timeline:**
- Buffer: 2 hari tersisa di akhir minggu 4 untuk bug fixing.
- Kalau tertinggal: turunkan prioritas fitur Could (reservasi, analytics, dark mode).
- Kalau waktu lebih: tambahkan fitur Could atau polish UX.

---

## 14. Risiko & Mitigasi

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|--------------|--------|----------|
| Scope creep — ingin tambah fitur terus | Tinggi | Tinggi | Patuhi PRD; fitur baru masuk backlog v1.1 |
| Laptop jadul lambat | Tinggi | Sedang | Pakai GitHub Codespaces; jangan jalankan DB/worker lokal |
| Kurva belajar Next.js/Supabase | Sedang | Sedang | Ikuti tutorial resmi; mulai dari fitur sederhana |
| RLS salah konfigurasi — data bocor | Sedang | Tinggi | Test RLS manual tiap policy; gunakan Supabase test user |
| Logic is_verified bug | Sedang | Tinggi | Unit test untuk fungsi verifikasi; e2e test alur lengkap |
| Biaya LLM/infrastruktur | Rendah | Rendah | Tidak pakai AI; semua free tier |
| Deploy gagal di akhir | Sedang | Tinggi | Deploy awal di hari 1 (bukan di akhir); deploy tiap minggu |
| Kehilangan motivasi | Sedang | Tinggi | Milestone mingguan jelas; demo ke teman tiap minggu |
| Data seed tidak siap | Sedang | Sedang | Seed data dibuat di minggu 1, bukan minggu 4 |

---

## 15. Definition of Done (DoD)

### 15.1 DoD untuk Setiap Fitur

- ✅ Fungsional sesuai FR
- ✅ Validasi input di client + server
- ✅ RLS policy aktif dan di-test
- ✅ Loading state, empty state, error state
- ✅ Responsive di mobile, tablet, desktop
- ✅ Tidak ada console.error di production
- ✅ Code review (self-review dengan checklist)
- ✅ Commit message mengikuti conventional commits

### 15.2 DoD untuk Rilis 1.0

- ✅ Semua FR Must selesai
- ✅ Semua FR Should selesai (atau terdokumentasi jika ditunda)
- ✅ 3 skenario e2e lulus
- ✅ Seed data lengkap
- ✅ README lengkap (setup, arsitektur, env vars, screenshot)
- ✅ Deploy live di Vercel + Supabase production
- ✅ Demo video 3 menit
- ✅ Slide presentasi 10 halaman
- ✅ Tidak ada secret di repo
- ✅ Lighthouse score ≥ 80 (Performance, Accessibility, Best Practices, SEO)

---

## 16. Out of Scope & Future Roadmap

### 16.1 Ditunda ke v1.1

- ISBN scanner / Open Library API integration
- Notifikasi email
- Reading list publik
- Analytics lanjutan (grafik, export)
- Dark mode
- Multi-tenant
- Chat antar anggota

### 16.2 Ditunda ke v2.0

- Aplikasi mobile (React Native / Expo)
- Payment gateway untuk denda
- Rekomendasi berbasis ML
- Integrasi dengan perpustakaan nasional
- API publik untuk developer

---

## 17. Lampiran

### 17.1 Glossary

| Istilah | Definisi |
|---------|----------|
| Member | Anggota terdaftar yang sudah login |
| Guest | Pengunjung belum login |
| Verified Review | Ulasan dari user yang pernah meminjam & mengembalikan buku |
| Unverified Review | Ulasan dari user yang belum pernah meminjam buku |
| Overdue | Status peminjaman yang melewati jatuh tempo |
| Reservasi | Antrian untuk buku yang stoknya habis |
| RLS | Row Level Security — aturan akses per baris di Postgres |

### 17.2 Referensi

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Drizzle ORM: https://orm.drizzle.team
- Zod: https://zod.dev

### 17.3 Approval & Revisi

| Versi | Tanggal | Perubahan | Status |
|-------|---------|-----------|--------|
| 1.0 | 2 Nov 2026 | Dokumen awal, disetujui untuk eksekusi | ✅ Approved |