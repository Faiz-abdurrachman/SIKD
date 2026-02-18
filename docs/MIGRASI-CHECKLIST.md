# Checklist Migrasi React + Express (Lokal)

## Infrastruktur
- [x] Dokumen plan migrasi dibuat
- [x] `apps/api` (Express) terbentuk
- [x] `apps/web` (React + Vite) terbentuk
- [x] Script run lokal terpadu tersedia (`dev:local`)

## API Parity `v1`
- [x] Dashboard (`overview`, `stats`, `demografi`, `recent-mutasi`, `recent-surat`)
- [x] Penduduk (list/create/search/detail/update/delete)
- [x] Keluarga (list/create/search/detail/update/delete)
- [x] Keluarga anggota (add/update/remove)
- [x] Mutasi (list/create/detail)
- [x] Surat (list/create/detail/update/delete)
- [x] Surat workflow (`submit`, `approve`, `reject`, `print`, `complete`)
- [x] Surat PDF (`GET /surat/:id/pdf`)
- [x] Laporan summary
- [x] Wilayah (`options`, `overview`, `desa`, `dusun`, `rw`, `rt` + CRUD yang relevan)
- [x] Users (list/create/detail/update/toggle/reset-password)
- [x] Settings (get/update)
- [x] Audit logs (list)

## Web Modules
- [x] Dashboard
- [x] Penduduk
- [x] Keluarga
- [x] Surat
- [x] Mutasi
- [x] Laporan
- [x] Wilayah
- [x] Pengguna
- [x] Pengaturan
- [x] Audit Log

## Performa & Stabilitas
- [x] Profiling request endpoint aktif (`[API PERF]`)
- [x] Dev StrictMode nonaktif untuk mengurangi fetch ganda
- [x] Smoke test endpoint utama berhasil

## Validasi
- [x] `npm run typecheck:api`
- [x] `npm run typecheck:web`
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build:web`
- [x] Startup `npm run dev:local` berhasil
