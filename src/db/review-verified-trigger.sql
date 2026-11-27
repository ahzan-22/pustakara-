-- File: src/db/review-verified-trigger.sql
-- Jalankan SETELAH rls.sql sukses dan aplikasi sudah dites normal.
--
-- MASALAH: policy reviews lama memakai `with check (auth.uid() = user_id)`
-- tanpa membedakan kolom. Artinya user masih bisa mengirim PATCH langsung ke
-- REST API Supabase dengan body {"is_verified": true} untuk ulasannya sendiri,
-- dan nilai itu diterima apa adanya -> fitur Ulasan Hybrid bisa dibobol.
--
-- FIX: `is_verified` tidak pernah dipercaya dari client.
--   - user biasa -> selalu dihitung ulang dari riwayat pinjaman
--     (ada loan status 'returned' untuk user+buku itu -> true)
--   - admin       -> boleh mengubah (dipakai auto-verify saat pengembalian)
--
-- MASALAH KEDUA: policy yang sama juga tidak mengunci kolom identitas baris.
-- User bisa PATCH {"book_id": "<buku-lain>"} pada ulasannya sendiri, sehingga
-- ulasan terbit di buku yang tidak pernah dia pinjam (fitur "ulasan terverifikasi
-- pembaca" jadi bisa dibobol tanpa lewat jalur pinjam-mengembalikan).
--
-- FIX KEDUA: di jalur UPDATE non-admin, identitas baris dibekukan di tempat -
-- id, user_id, book_id dan created_at diambil kembali dari baris lama.

create or replace function public.enforce_review_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_returned_loan boolean;
begin
  -- Admin: biarkan (inilah jalur auto-verify saat buku dikembalikan)
  if public.is_admin() then
    return new;
  end if;

  -- User biasa: baris tidak boleh dipindahkan ke buku/user lain atau
  -- identitasnya diubah (TG_OP = 'UPDATE' saja; di INSERT belum ada OLD)
  if TG_OP = 'UPDATE' then
    new.id         := old.id;
    new.user_id    := old.user_id;
    new.book_id    := old.book_id;
    new.created_at := old.created_at;
  end if;

  -- User biasa: abaikan nilai is_verified dari client, pakai fakta di tabel loans
  select exists (
    select 1
    from public.loans
    where user_id = new.user_id
      and book_id = new.book_id
      and status = 'returned'
  ) into has_returned_loan;

  new.is_verified := has_returned_loan;
  return new;
end;
$$;

drop trigger if exists enforce_review_verification on public.reviews;
create trigger enforce_review_verification
before insert or update on public.reviews
for each row
execute function public.enforce_review_verification();

-- ============================================
-- Verifikasi
-- ============================================
-- 1. Cek trigger terpasang:
-- select tgname from pg_trigger
-- where tgrelid = 'public.reviews'::regclass and tgname = 'enforce_review_verification';
--
-- 2. Cek fungsi & policy admin ada:
-- select proname from pg_proc where pronamespace = 'public'::regnamespace
--   and proname in ('is_admin', 'enforce_review_verification');
-- select policyname from pg_policies where tablename = 'reviews';
--
-- 3. Tes perilaku (SQL Editor jalan sebagai postgres; auth.uid() kosong jadi
--    is_admin() = false -> masuk jalur user biasa):
--
-- update public.reviews
-- set is_verified = true
-- where id = '<id-ulasan>'
-- returning id, is_verified;
--
--    Hasilnya TRUE hanya kalau user pemilik ulasan itu memang punya loan
--    status 'returned' untuk buku yang sama; selain itu dipaksa jadi FALSE
--    (artinya client tidak bisa lagi memalsukan nilai ini).
--
-- 4. Tes end-to-end di aplikasi:
--    - tulis ulasan saat buku masih dipinjam  -> label "💬 Kamu mengulas sebagai pembaca"
--    - admin Konfirmasi Kembali               -> label berubah "✅ Kamu sudah meminjam buku ini"
--    - edit ulasan setelahnya                 -> label TETAP ✅ (tidak balik ke 💬)
--
-- 5. Tes penguncian kolom identitas (masuk jalur user biasa, sama seperti tes 3):
--
-- update public.reviews
-- set book_id = '<uuid-buku-lain>'
-- where id = '<id-ulasan>'
-- returning id, book_id;
--
--    Hasilnya book_id TIDAK berubah (tetap buku asal) - baris dibekukan.
--    Kolom yang masih boleh diubah user biasa: rating, body, is_spoiler.
