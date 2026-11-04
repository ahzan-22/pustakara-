# Arsitektur Project: Pustakara (Trustread)

Dokumen ini menjelaskan arsitektur teknis, alur data, dan struktur direktori untuk aplikasi perpustakaan digital. Dokumen ini terpisah dari PRD (Product Requirements Document) dan berfokus pada **implementasi teknis**.

## 1. High-Level Architecture (Gambaran Besar)

Aplikasi ini menggunakan arsitektur **Monolith Modern (Full-stack Framework)**. Tidak ada backend terpisah (seperti Laravel/Express). Frontend dan Backend menyatu di dalam Next.js.

```text
[ Browser / Client ]
       │
       │ (HTTP Requests / RSC Payload)
       ▼
[ Next.js App Router (Vercel) ]
  ├── Server Components (SSR & SEO)
  ├── API Routes / Server Actions (Logic Bisnis)
  └── Middleware (Proteksi Route)
       │
       │ (Supabase SDK / SQL)
       ▼
[ Supabase (Cloud) ]
  ├── PostgreSQL (Database + RLS)
  ├── Auth (JWT & Session)
  └── Storage (Cover Buku & Avatar)