# Migrasi Stack Lokal: Next.js -> React + Express

## Ringkasan
Migrasi lokal sudah dipindahkan ke dua app:
- `apps/api`: Express API (reuse service + Prisma existing)
- `apps/web`: React + Vite frontend

Target utama: pindah stack tanpa mengacak business logic lama, tetap ringan untuk local development.

## Status Implementasi
### 1. Backend Express (`apps/api`)
Sudah tersedia endpoint v1 berikut:
- Dashboard:
  - `GET /api/v1/dashboard/overview`
  - `GET /api/v1/dashboard/stats`
  - `GET /api/v1/dashboard/demografi`
  - `GET /api/v1/dashboard/recent-mutasi`
  - `GET /api/v1/dashboard/recent-surat`
- Penduduk:
  - `GET /api/v1/penduduk`
  - `POST /api/v1/penduduk`
  - `GET /api/v1/penduduk/search`
  - `GET /api/v1/penduduk/:id`
  - `PUT /api/v1/penduduk/:id`
  - `DELETE /api/v1/penduduk/:id`
- Keluarga:
  - `GET /api/v1/keluarga`
  - `POST /api/v1/keluarga`
  - `GET /api/v1/keluarga/search`
  - `GET /api/v1/keluarga/:id`
  - `PUT /api/v1/keluarga/:id`
  - `DELETE /api/v1/keluarga/:id`
  - `POST /api/v1/keluarga/:id/anggota`
  - `PUT /api/v1/keluarga/:id/anggota/:pid`
  - `DELETE /api/v1/keluarga/:id/anggota/:pid`
- Mutasi:
  - `GET /api/v1/mutasi`
  - `POST /api/v1/mutasi`
  - `GET /api/v1/mutasi/:id`
- Surat:
  - `GET /api/v1/surat`
  - `POST /api/v1/surat`
  - `GET /api/v1/surat/:id`
  - `PUT /api/v1/surat/:id`
  - `DELETE /api/v1/surat/:id`
  - `PATCH /api/v1/surat/:id/submit`
  - `PATCH /api/v1/surat/:id/approve`
  - `PATCH /api/v1/surat/:id/reject`
  - `PATCH /api/v1/surat/:id/print`
  - `PATCH /api/v1/surat/:id/complete`
  - `GET /api/v1/surat/:id/pdf`
- Laporan:
  - `GET /api/v1/laporan/summary`
- Wilayah:
  - `GET /api/v1/wilayah/options`
  - `GET /api/v1/wilayah/overview`
  - `GET /api/v1/wilayah/desa`
  - `PUT /api/v1/wilayah/desa`
  - `GET /api/v1/wilayah/dusun`
  - `POST /api/v1/wilayah/dusun`
  - `PUT /api/v1/wilayah/dusun/:id`
  - `DELETE /api/v1/wilayah/dusun/:id`
  - `GET /api/v1/wilayah/rw`
  - `POST /api/v1/wilayah/rw`
  - `PUT /api/v1/wilayah/rw/:id`
  - `DELETE /api/v1/wilayah/rw/:id`
  - `GET /api/v1/wilayah/rt`
  - `POST /api/v1/wilayah/rt`
  - `PUT /api/v1/wilayah/rt/:id`
  - `DELETE /api/v1/wilayah/rt/:id`
- Pengguna:
  - `GET /api/v1/users`
  - `POST /api/v1/users`
  - `GET /api/v1/users/:id`
  - `PUT /api/v1/users/:id`
  - `PATCH /api/v1/users/:id/toggle`
  - `POST /api/v1/users/:id/reset-password`
- Pengaturan:
  - `GET /api/v1/settings`
  - `PUT /api/v1/settings`
- Audit:
  - `GET /api/v1/audit-logs`

### 2. Frontend React (`apps/web`)
Halaman aktif:
- Dashboard
- Penduduk
- Keluarga
- Surat
- Mutasi
- Laporan
- Wilayah
- Pengguna
- Pengaturan
- Audit Log

### 3. Optimasi Ringan
- Fetch ganda mode dev dikurangi dengan menghapus `React.StrictMode` di `apps/web/src/main.tsx`.
- Request profiling aktif pada endpoint API penting (termasuk laporan/mutasi/surat), log tampil sebagai `[API PERF]`.

## Hal yang Sengaja Dipertahankan
- Layer domain (service + validation + Prisma) tetap reuse dari kode existing supaya migrasi aman.
- Next.js lama tidak dihapus, tetap bisa dipakai sebagai baseline (`npm run dev`).

## Catatan
- Endpoint auth NextAuth tidak dipindah ke Express karena mode lokal memakai `devAuthMiddleware` (`x-user-id`, `x-user-role`) agar pengerjaan dan pengujian lebih cepat.
