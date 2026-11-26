-- File: src/db/rls.sql
-- Jalankan di Supabase SQL Editor. Aman dijalankan berulang (idempoten).
--
-- SEBELUM: hanya `reviews` yang punya RLS; books/categories/loans/profiles/
-- wishlists UNRESTRICTED -> siapa pun dengan anon key bisa baca/tulis bebas,
-- termasuk `update profiles set role = 'admin'`.
--
-- SESUDAH: semua tabel public dikunci, akses hanya lewat policy di bawah.
--
-- PENTING: setelah ini, lupa satu policy = aplikasi error (query jadi 0 baris).
-- Tes urut setelah menjalankan:
--   1. Halaman publik (buka detail buku tanpa login)  -> ulasan & nama tampil
--   2. Login member -> dashboard, pinjam buku, tulis ulasan, wishlist
--   3. Login admin  -> /admin/loans, Setujui & Konfirmasi Kembali
--      (cek terminal: log "Stok buku <id>: 1 -> 0" harus muncul)

-- ============================================
-- 0. Helper: role admin
--    SECURITY DEFINER supaya tidak rekursi ke tabel profiles
--    (policy profiles memanggil fungsi ini di dalam tabel yang sama).
-- ============================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ============================================
-- 1. profiles
--    dibutuhkan: baca nama+role publik (join ulasan, navbar),
--    insert row sendiri saat login pertama (fallback dashboard).
--    TANPA policy update/delete -> user tidak bisa promosi diri jadi admin.
-- ============================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
for select using (true);

drop policy if exists "profiles_insert_self_member" on public.profiles;
create policy "profiles_insert_self_member" on public.profiles
for insert with check (id = auth.uid() and role = 'member');

-- ============================================
-- 2. books
--    dibutuhkan: baca katalog publik, insert saat pinjam/ulas/wishlist,
--    update stok hanya admin.
-- ============================================
alter table public.books enable row level security;

drop policy if exists "books_select_public" on public.books;
create policy "books_select_public" on public.books
for select using (true);

drop policy if exists "books_insert_authenticated" on public.books;
create policy "books_insert_authenticated" on public.books
for insert with check (auth.uid() is not null);

drop policy if exists "books_update_admin" on public.books;
create policy "books_update_admin" on public.books
for update using (public.is_admin())
with check (public.is_admin());

-- Tidak ada hapus buku di aplikasi -> tanpa policy delete.

-- ============================================
-- 3. categories
-- ============================================
alter table public.categories enable row level security;

drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories
for select using (true);

-- ============================================
-- 4. loans
--    dibutuhkan: baca milik sendiri + semua (admin),
--    insert saat pengajuan pinjaman, update status/stok hanya admin.
-- ============================================
alter table public.loans enable row level security;

drop policy if exists "loans_select_own_or_admin" on public.loans;
create policy "loans_select_own_or_admin" on public.loans
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "loans_insert_own" on public.loans;
create policy "loans_insert_own" on public.loans
for insert with check (user_id = auth.uid());

drop policy if exists "loans_update_admin" on public.loans;
create policy "loans_update_admin" on public.loans
for update using (public.is_admin())
with check (public.is_admin());

-- Tidak ada hapus pinjaman di aplikasi -> tanpa policy delete.

-- ============================================
-- 5. reviews
--    RLS + policy select publik dan "user kelola ulasannya sendiri"
--    sudah ada sejak awal dan tidak diubah. Ditambah: update oleh admin
--    untuk auto-verify (is_verified) saat pengembalian buku.
-- ============================================
alter table public.reviews enable row level security;

-- versi lama yang pernah dibuat manual, dibersihkan supaya tidak dobel
drop policy if exists "admin can update any review" on public.reviews;

drop policy if exists "admin_update_reviews" on public.reviews;
create policy "admin_update_reviews" on public.reviews
for update using (public.is_admin())
with check (public.is_admin());

-- ============================================
-- 6. wishlists
--    sepenuhnya milik user yang login.
-- ============================================
alter table public.wishlists enable row level security;

drop policy if exists "wishlists_select_own" on public.wishlists;
create policy "wishlists_select_own" on public.wishlists
for select using (user_id = auth.uid());

drop policy if exists "wishlists_insert_own" on public.wishlists;
create policy "wishlists_insert_own" on public.wishlists
for insert with check (user_id = auth.uid());

drop policy if exists "wishlists_delete_own" on public.wishlists;
create policy "wishlists_delete_own" on public.wishlists
for delete using (user_id = auth.uid());

-- ============================================
-- Verifikasi: jalankan setelah semua di atas sukses
-- ============================================
-- select c.relname as tabel, c.relrowsecurity as rls_aktif
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relkind = 'r'
-- order by c.relname;
--
-- select tablename, policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;
