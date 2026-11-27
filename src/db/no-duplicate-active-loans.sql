-- File: src/db/no-duplicate-active-loans.sql
-- Jalankan SETELAH rls.sql dan review-verified-trigger.sql sukses.
--
-- MASALAH: cek "sudah pernah meminjam buku ini?" hanya ada di kode aplikasi
-- (/api/loans). Dua request yang datang bersamaan bisa sama-sama lolos cek
-- lalu menginsert dua loan aktif untuk user + buku yang sama (race condition),
-- dan stok buku bisa terpotong dua kali saat approve.
--
-- FIX: unique index parsial di database. Baris yang dianggap "aktif"
-- (pending/approved/borrowed/overdue) wajib unik per user+buku.
-- Loan berstatus 'returned'/'rejected' TIDAK ikut tercakup, jadi user tetap
-- boleh meminjam buku yang sama lagi setelah mengembalikan atau ditolak.

-- ============================================
-- Langkah 0: cek dulu apakah sudah ada duplikat
-- ============================================
-- Kalau query ini menghasilkan baris, index di Langkah 1 akan gagal dibuat.
-- Selesaikan dulu duplikatnya secara manual (mis. tandai loan kedua sebagai
-- 'rejected'), baru jalankan Langkah 1.
--
-- select user_id, book_id, count(*) as jumlah, array_agg(id) as loan_ids
-- from public.loans
-- where status in ('pending', 'approved', 'borrowed', 'overdue')
-- group by user_id, book_id
-- having count(*) > 1;

-- ============================================
-- Langkah 1: pasang unique index
-- ============================================
create unique index if not exists loans_one_active_per_user_book
  on public.loans (user_id, book_id)
  where status in ('pending', 'approved', 'borrowed', 'overdue');

-- ============================================
-- Verifikasi
-- ============================================
-- 1. Index terpasang:
-- select indexname from pg_indexes
-- where tablename = 'loans' and indexname = 'loans_one_active_per_user_book';
--
-- 2. Index bekerja (harus error 23505 duplicate key):
--    Ganti <user-id> & <book-id> dengan id yang loan aktifnya sudah ada:
--
-- insert into public.loans (user_id, book_id, status)
-- values ('<user-id>', '<book-id>', 'pending');
--
--    Rollback perintah di atas kalau tidak jadi, atau hapus baris yang terlanjur
--    terinsert:
-- delete from public.loans
-- where user_id = '<user-id>' and book_id = '<book-id>' and status = 'pending'
--   and created_at > now() - interval '1 minute';
--
-- 3. Tes end-to-end di aplikasi:
--    - klik "Pinjam" dua kali cepat pada buku yang sama
--      -> yang kedua dapat 409 "Anda sudah mengajukan atau meminjam buku ini"
--      (bukan 500, karena /api/loans menerjemahkan error 23505)
--    - pinjam buku, kembalikan, lalu pinjam lagi -> tetap berhasil
