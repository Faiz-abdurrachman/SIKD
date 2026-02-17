# Migrasi Stack Lokal: Next.js -> React + Express

## Tujuan
- Pindah stack aplikasi ke `React (Vite)` untuk frontend dan `Express` untuk backend.
- Fokus **lokal dulu** (tanpa deploy).
- Menjaga perilaku inti aplikasi tetap konsisten dan tidak berantakan.

## Prinsip Eksekusi (Anti-Ngayal)
- Tidak ada klaim "selesai" jika endpoint/UI belum benar-benar bisa dijalankan lokal.
- Migrasi dilakukan bertahap, setiap tahap ada output konkret yang bisa dites.
- Scope jelas: modul prioritas dipindah dulu, modul lain tetap tercatat sebagai backlog.

## Scope Tahap Ini
- Scaffold backend `apps/api` (Express + Prisma + service existing).
- Scaffold frontend `apps/web` (React + Vite).
- Modul prioritas:
  - Dashboard overview
  - Penduduk (list)
  - Keluarga (list)
  - Laporan summary
- Endpoint read tambahan:
  - Mutasi (list)
  - Surat (list)
- Auth sementara untuk lokal:
  - Dev auth via header (`x-user-id`, `x-user-role`) dengan fallback user aktif pertama.

## Out of Scope Tahap Ini
- Deploy production.
- Migrasi 100% semua halaman CRUD detail.
- Penggantian total sistem auth ke production-grade JWT/session.

## Struktur Target
- `apps/api` -> Express API
- `apps/web` -> React Vite app
- Reuse layer domain existing:
  - `src/services/*`
  - `src/validations/*`
  - `src/lib/prisma.ts`

## Rencana Implementasi
1. **Dokumentasi dan guardrail**
   - File plan + checklist migrasi.
2. **Backend Express**
   - Setup server, middleware, route v1.
   - Port endpoint prioritas.
3. **Frontend React**
   - Setup Vite + routing.
   - Halaman prioritas konsumsi endpoint baru.
4. **Script Lokal**
   - Jalankan API + Web bersamaan.
5. **Validasi**
   - Lint/typecheck.
   - Uji endpoint prioritas dan render halaman prioritas.

## Kriteria Selesai Tahap Ini
- `npm run dev:local` menyalakan API + Web tanpa error startup.
- Halaman `Dashboard`, `Penduduk`, `Keluarga`, `Laporan` terbuka dari web React dan menampilkan data dari Express API.
- Endpoint prioritas memberi respons JSON dengan format konsisten (`success/data/meta`).

## Risiko dan Mitigasi
- **Risiko**: perubahan auth memutus alur write/audit.
  - **Mitigasi**: fallback user aktif dari DB untuk local dev agar audit tetap valid.
- **Risiko**: mismatch type Date/string.
  - **Mitigasi**: normalisasi type payload di web dan endpoint response.
- **Risiko**: transisi parsial membingungkan.
  - **Mitigasi**: dokumentasi runbook dan status scope jelas.

## Rollback
- Seluruh migrasi dilakukan sebagai perubahan terpisah; Next.js lama tetap ada sebagai baseline.
- Jika ada masalah kritis, kembali jalankan stack lama dengan script `npm run dev`.
