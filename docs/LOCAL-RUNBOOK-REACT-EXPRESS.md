# Runbook Lokal: React + Express

## 1. Prasyarat
- Node.js `20.x`
- PostgreSQL aktif dan sesuai `DATABASE_URL`
- Prisma migrate + seed user sudah dijalankan

## 2. Environment
Gunakan `.env` (minimal):

```bash
DATABASE_URL="postgresql://sidesa:sidesa_password@localhost:5432/sidesa_db"
API_PORT="3001"
WEB_ORIGIN="http://localhost:5173"
VITE_API_BASE_URL="http://localhost:3001"
VITE_DEV_USER_ID=""
VITE_DEV_USER_ROLE="SUPER_ADMIN"
```

Catatan:
- Jika `VITE_DEV_USER_ID` kosong, API fallback ke user aktif pertama.
- `VITE_DEV_USER_ROLE` bisa diganti (`SUPER_ADMIN`, `KEPALA_DESA`, `SEKRETARIS`, `OPERATOR`) untuk uji RBAC.

## 3. Jalankan Stack Lokal Baru

```bash
npm install
npm run dev:local
```

Akses:
- Web React: `http://localhost:5173`
- API Express: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

## 4. Menjalankan Terpisah (opsional)

```bash
# terminal 1
npm run dev:api

# terminal 2
npm run dev:web
```

## 5. Modul Web yang Tersedia
- `/` Dashboard
- `/penduduk`
- `/keluarga`
- `/surat`
- `/mutasi`
- `/laporan`
- `/wilayah`
- `/pengguna`
- `/pengaturan`
- `/audit-log`

## 6. Verifikasi Cepat API

```bash
curl -sS http://localhost:3001/health
curl -sS -H 'x-user-role: SUPER_ADMIN' 'http://localhost:3001/api/v1/dashboard/overview?limit=2'
curl -sS -H 'x-user-role: SUPER_ADMIN' 'http://localhost:3001/api/v1/laporan/summary'
curl -sS -H 'x-user-role: SUPER_ADMIN' 'http://localhost:3001/api/v1/surat?page=1&limit=2'
curl -sS -H 'x-user-role: SUPER_ADMIN' 'http://localhost:3001/api/v1/users?page=1&limit=2'
curl -sS -H 'x-user-role: SUPER_ADMIN' 'http://localhost:3001/api/v1/audit-logs?page=1&limit=2'
```

## 7. Profiling Request Time
Saat API berjalan, lihat log `[API PERF]` di terminal API. Contoh endpoint penting:
- `GET /api/v1/laporan/summary`
- `GET /api/v1/mutasi`
- `GET /api/v1/surat`

Log menampilkan `totalMs` + breakdown (`authMs`, `validationMs`, `serviceMs`, `responseMs`).

## 8. Script Penting
- `npm run dev` / `npm run dev:next`: Next.js lama (baseline)
- `npm run dev:api`: Express API baru
- `npm run dev:web`: React Vite baru
- `npm run dev:local`: API + Web baru
- `npm run typecheck`
- `npm run lint`
- `npm run build:web`
