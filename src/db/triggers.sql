-- File: src/db/triggers.sql
-- Jalankan skrip ini di Supabase SQL Editor.
-- Pastikan tabel `public.profiles` sudah dibuat melalui Drizzle migration sebelum menjalankan ini.

-- ============================================
-- 1. Fungsi PL/pgSQL: sinkronisasi auth.users -> profiles
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    'member',
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Trigger: panggil fungsi setelah INSERT di auth.users
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. (Opsional) Ubah role user menjadi 'admin'
-- ============================================
-- Ganti '<user-id>' dengan UUID sebenarnya dari tabel auth.users
-- Contoh:
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
