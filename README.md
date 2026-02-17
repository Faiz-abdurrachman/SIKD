# SIDESA

Sistem Informasi Kependudukan Desa berbasis Next.js, Prisma, PostgreSQL, dan RBAC.

## 0. Stack dan Requirement

- Node.js `20.x` (wajib, jangan pakai Node 25 untuk runtime project ini)
- npm `10+`
- PostgreSQL `16+` (local development)
- Docker + Docker Compose (opsional, untuk production/deploy)

## 1. Setup Prasyarat per OS

### 1.1 Windows 10/11

1. Install Git: https://git-scm.com/download/win
2. Install Node.js 20 LTS: https://nodejs.org/en/download
3. Install PostgreSQL (EnterpriseDB installer): https://www.postgresql.org/download/windows/
4. Pastikan service PostgreSQL aktif.

Rekomendasi terminal: PowerShell atau Git Bash.

### 1.2 macOS

Install Homebrew dulu jika belum ada: https://brew.sh

```bash
brew update
brew install node@20 postgresql@16 git
brew services start postgresql@16
```

### 1.3 Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y curl git build-essential
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Install Node 20 (pakai nvm):

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 1.4 Arch Linux

```bash
sudo pacman -Syu
sudo pacman -S --needed git nodejs npm postgresql
```

Inisialisasi database PostgreSQL (sekali saja):

```bash
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
```

## 2. Clone Project

```bash
git clone https://github.com/Faiz-abdurrachman/SIKD.git
cd SIKD/sidesa
```

## 3. Setup Environment

Linux/macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Catatan penting:

1. Next.js membaca `.env.local` lebih dulu daripada `.env`.
2. Prisma CLI di project ini sudah diset membaca `.env` lalu override dari `.env.local` bila ada.
3. Jangan isi `DATABASE_URL` beda antara `.env` dan `.env.local`.

Minimal env:

```env
DATABASE_URL="postgresql://sidesa:sidesa_password@localhost:5432/sidesa_db"
NEXTAUTH_SECRET="isi-random-minimal-32-karakter"
NEXTAUTH_URL="http://localhost:3000"
```

## 4. Setup Database PostgreSQL

Jalankan perintah berikut:

```bash
sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sidesa') THEN
    CREATE ROLE sidesa WITH LOGIN PASSWORD 'sidesa_password';
  ELSE
    ALTER ROLE sidesa WITH LOGIN PASSWORD 'sidesa_password';
  END IF;
END
$$;
ALTER ROLE sidesa CREATEDB;
SQL
```

```bash
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='sidesa_db'" | grep -q 1 || \
sudo -u postgres createdb -O sidesa sidesa_db
```

```bash
sudo -u postgres psql -d sidesa_db -v ON_ERROR_STOP=1 <<'SQL'
GRANT ALL PRIVILEGES ON DATABASE sidesa_db TO sidesa;
GRANT ALL ON SCHEMA public TO sidesa;
ALTER SCHEMA public OWNER TO sidesa;
SQL
```

## 5. Install Dependency + Migrate + Seed

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

Verifikasi akun seed:

```bash
npm run verify:seed-users
```

Jika hasilnya `Result: OK`, akun seed valid.

## 6. Jalankan Aplikasi

```bash
npm run dev
```

Akses: `http://localhost:3000`

## 7. Akun Login Seed

Gunakan username (bukan email):

- `admin / Admin@2026` (Super Admin)
- `kades / User@2026` (Kepala Desa)
- `sekdes / User@2026` (Sekretaris)
- `operator / User@2026` (Operator)

## 7.1 Kebijakan Keamanan Login

Sistem menerapkan hardening login:

1. Username login tidak case-sensitive (`KADES` dianggap sama dengan `kades`).
2. Setelah 5 kali gagal login berturut-turut pada akun yang sama, akun dikunci sementara 15 menit.
3. Event keamanan login dicatat ke `Audit Log` dengan entity `auth`.

Jika akun terkunci karena salah password berulang, tunggu 15 menit lalu coba lagi.

## 8. Quality Check (wajib clean)

```bash
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
```

## 9. Production Docker

Build:

```bash
npm run docker:build
```

Up:

```bash
npm run docker:up
```

Apply migration di container:

```bash
docker compose -f docker/docker-compose.yml run --rm app npx prisma migrate deploy
```

Logs:

```bash
npm run docker:logs
```

Down:

```bash
npm run docker:down
```

## 10. Deploy Script

```bash
npm run deploy:prod
```

atau:

```bash
bash scripts/deploy.sh
```

## 11. GitHub Actions Deploy

Workflow: `.github/workflows/deploy.yml`

Set secret berikut di repository:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PROJECT_PATH`

Jika gagal dengan `missing server host`, berarti `VPS_HOST` belum terisi atau salah nama.

## 12. Backup / Restore

Backup:

```bash
npm run backup:db
```

Custom retensi:

```bash
bash scripts/backup.sh 14
```

Restore:

```bash
npm run restore:db -- ./backups/<nama-file>.sql.gz
```

## 13. Troubleshooting

### 13.1 `P1010: User was denied access`

1. Cek `DATABASE_URL` benar.
2. Cek role/db/privilege sudah dibuat.
3. Pastikan password di `DATABASE_URL` sama dengan password role PostgreSQL.

### 13.2 `P3014: permission denied to create database`

```sql
ALTER ROLE sidesa CREATEDB;
```

### 13.3 Seed sukses tapi akun `kades/sekdes/operator` tidak bisa login

Lakukan urutan ini:

1. Pastikan login pakai `username`, bukan email.
2. Jalankan `npm run verify:seed-users`.
3. Samakan `DATABASE_URL` di `.env` dan `.env.local`.
4. Logout akun admin dulu atau buka incognito (hindari session cache lama).
5. Reseed:

```bash
npx prisma db seed
npm run verify:seed-users
```

### 13.4 Build error / crash

```bash
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### 13.5 Build/dev terasa berat

1. Pastikan Node `20.x`.
2. Tutup tab/browser yang tidak perlu.
3. Jalankan production mode untuk test performa:

```bash
npm run build
npm run start
```

### 13.6 Akun terkunci sementara

Jika butuh buka kunci akun lebih cepat, jalankan SQL ini:

```sql
UPDATE users
SET
  failed_login_attempts = 0,
  last_failed_login_at = NULL,
  locked_until = NULL
WHERE username = 'kades';
```

## 14. E2E Smoke Test (Playwright)

E2E smoke test sudah disiapkan untuk validasi:

1. Redirect auth (guest wajib ke `/login`).
2. Login gagal menampilkan error.
3. Login + RBAC menu/route untuk 4 role (`admin`, `kades`, `sekdes`, `operator`).
4. Cek modul utama tanpa console error `Parameter pencarian tidak valid`.

### 14.1 Install browser E2E (sekali per mesin)

```bash
npm run test:e2e:install
```

### 14.2 Jalankan E2E smoke test

```bash
npm run test:e2e
```

Mode headed:

```bash
npm run test:e2e:headed
```

Mode UI:

```bash
npm run test:e2e:ui
```

Output report:

- HTML report: `playwright-report/index.html`
- Raw result: `test-results/`

Catatan:

1. Jalankan migrate + seed dulu (`npx prisma migrate dev` dan `npx prisma db seed`).
2. Default credential E2E mengikuti seed.
3. Bisa override credential via env:
   - `E2E_ADMIN_USERNAME`, `E2E_ADMIN_PASSWORD`
   - `E2E_KADES_USERNAME`, `E2E_KADES_PASSWORD`
   - `E2E_SEKDES_USERNAME`, `E2E_SEKDES_PASSWORD`
   - `E2E_OPERATOR_USERNAME`, `E2E_OPERATOR_PASSWORD`

## 15. Struktur Deploy

- Dockerfile: `docker/Dockerfile`
- Compose: `docker/docker-compose.yml`
- Nginx: `docker/nginx.conf`
- Deploy script: `scripts/deploy.sh`
- Backup script: `scripts/backup.sh`
- Restore script: `scripts/restore.sh`

## License

Internal project.
