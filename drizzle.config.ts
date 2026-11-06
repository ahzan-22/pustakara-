import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Memastikan file .env.local dibaca oleh drizzle-kit
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL tidak ditemukan di file .env.local');
}

export default defineConfig({
  schema: './src/db/schema.ts', // Lokasi file skema tabelmu
  out: './drizzle',             // Folder untuk menyimpan riwayat migrasi
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});