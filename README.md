# SIDESA

Sistem Informasi Kependudukan Desa berbasis Next.js, Prisma, PostgreSQL, dan RBAC.

## Requirements

- Node.js 20.x
- npm 10+
- PostgreSQL 16 (untuk mode local)
- Docker + Docker Compose (untuk mode production/deploy)

## 1. Setup Local Development

### 1.1 Install dependency

```bash
npm install
```

### 1.2 Siapkan environment

```bash
cp .env.example .env
```

Pastikan `DATABASE_URL` mengarah ke database local kamu.

### 1.3 Jalankan migration + seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 1.4 Jalankan aplikasi

```bash
npm run dev
```

Akses: `http://localhost:3000`

## 2. Akun Login Seed

- `admin / Admin@2026` (Super Admin)
- `kades / User@2026` (Kepala Desa)
- `sekdes / User@2026` (Sekretaris)
- `operator / User@2026` (Operator)

## 3. Quality Check

```bash
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
```

## 4. Production (Docker)

### 4.1 Build image

```bash
npm run docker:build
```

### 4.2 Start stack

```bash
npm run docker:up
```

### 4.3 Apply migration di container app

```bash
docker compose -f docker/docker-compose.yml run --rm app npx prisma migrate deploy
```

### 4.4 Logs

```bash
npm run docker:logs
```

### 4.5 Stop stack

```bash
npm run docker:down
```

## 5. One-Command Deploy Script

Script ini akan:
1. `git pull origin main`
2. build image
3. `prisma migrate deploy`
4. up service

Jalankan:

```bash
npm run deploy:prod
```

Atau:

```bash
bash scripts/deploy.sh
```

## 6. Backup / Restore Database

### 6.1 Backup

```bash
npm run backup:db
```

Atau custom retensi:

```bash
bash scripts/backup.sh 14
```

Output backup: `backups/sidesa-YYYYMMDD-HHMMSS.sql.gz`

### 6.2 Restore

```bash
npm run restore:db -- ./backups/<nama-file>.sql.gz
```

Atau:

```bash
bash scripts/restore.sh ./backups/<nama-file>.sql.gz
```

## 7. Nginx & Reverse Proxy

Konfigurasi ada di:

- `docker/nginx.conf`

Sudah include:

- reverse proxy ke app (`app:3000`)
- gzip
- security headers (`X-Frame-Options`, `X-Content-Type-Options`, dll)
- static file caching

## 8. GitHub Actions Deploy (Opsional)

Workflow:

- `.github/workflows/deploy.yml`

Secrets yang harus diset di repository:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PROJECT_PATH`

## 9. Struktur Deploy

- Dockerfile: `docker/Dockerfile`
- Compose: `docker/docker-compose.yml`
- Nginx: `docker/nginx.conf`
- Deploy script: `scripts/deploy.sh`
- Backup script: `scripts/backup.sh`
- Restore script: `scripts/restore.sh`

## 10. Troubleshooting

### `P3014 shadow database permission denied`

Berikan role database permission `CREATEDB`:

```sql
ALTER ROLE sidesa CREATEDB;
```

### `P1010 User was denied access`

Pastikan:

- role database benar
- password di `DATABASE_URL` sesuai
- `GRANT` sudah diberikan ke role app

### Build error

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## License

Internal project.
