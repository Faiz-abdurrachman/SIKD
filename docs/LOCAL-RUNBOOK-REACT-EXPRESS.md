# Runbook Lokal: React + Express

## Prasyarat
- Node.js 20.x
- Database PostgreSQL aktif sesuai `DATABASE_URL`
- Prisma schema sudah termigrasi dan seed user tersedia

## Konfigurasi Environment
Gunakan `.env` (atau `.env.local`) minimal:

```bash
DATABASE_URL="postgresql://sidesa:sidesa_password@localhost:5432/sidesa_db"
API_PORT="3001"
WEB_ORIGIN="http://localhost:5173"
VITE_API_BASE_URL="http://localhost:3001"
VITE_DEV_USER_ID=""
VITE_DEV_USER_ROLE="SUPER_ADMIN"
```

Catatan:
- Jika `VITE_DEV_USER_ID` kosong, API akan fallback ke user aktif pertama di DB.
- `VITE_DEV_USER_ROLE` default `SUPER_ADMIN` untuk mempermudah akses modul lokal.

## Menjalankan Stack Lokal Baru
```bash
npm run dev:local
```

Endpoint:
- Web React: `http://localhost:5173`
- API Express: `http://localhost:3001`
- Health API: `http://localhost:3001/health`

## Menjalankan Terpisah
```bash
# terminal 1
npm run dev:api

# terminal 2
npm run dev:web
```

## Verifikasi Cepat
```bash
curl -sS http://localhost:3001/health
curl -sS -H 'x-user-role: SUPER_ADMIN' 'http://localhost:3001/api/v1/dashboard/overview?limit=2'
curl -sS -H 'x-user-role: SUPER_ADMIN' 'http://localhost:3001/api/v1/penduduk?page=1&limit=2'
curl -sS -H 'x-user-role: SUPER_ADMIN' 'http://localhost:3001/api/v1/laporan/summary'
```

## Script Penting
- `npm run dev` -> Next.js lama (baseline)
- `npm run dev:next` -> Next.js lama
- `npm run dev:api` -> Express API baru
- `npm run dev:web` -> React web baru
- `npm run dev:local` -> API + Web bersamaan
- `npm run typecheck:api`
- `npm run typecheck:web`
- `npm run build:web`
