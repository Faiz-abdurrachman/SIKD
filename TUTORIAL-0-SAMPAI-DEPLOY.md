# TUTORIAL SIDESA DARI NOL SAMPAI DEPLOY (STEP-BY-STEP)

Dokumen ini dibuat untuk pemula total. Ikuti urutan dari atas ke bawah.  
Semua blok `bash` bisa langsung copy-paste.

## 0. Target akhir

Setelah selesai, kamu harus bisa:

1. Menjalankan aplikasi di local (`npm run dev`)
2. Menjalankan migration + seed Prisma tanpa error
3. Build production tanpa error (`npm run build`)
4. Deploy ke VPS via GitHub Actions tanpa error `missing server host`

---

## 1. Persiapan awal (local laptop/PC)

Masuk ke folder project:

```bash
cd /home/faiz/projek/terbaru/sidesa
pwd
```

Pastikan versi Node:

```bash
node -v
npm -v
```

Node harus `20.x` (contoh: `v20.20.0`).

---

## 2. Siapkan file environment

Copy template env:

```bash
cp .env.example .env
```

Buka file:

```bash
nano .env
```

Pastikan minimal isi ini (boleh sama persis dulu):

```env
DATABASE_URL="postgresql://sidesa:sidesa_password@localhost:5432/sidesa_db"
NEXTAUTH_SECRET="isi-random-string-minimal-32-char"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="SIDESA"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_DESA_NAME="Desa Sukamaju"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5242880"
POSTGRES_DB="sidesa_db"
POSTGRES_USER="sidesa"
POSTGRES_PASSWORD="sidesa_password"
BACKUP_RETENTION_DAYS="7"
```

Generate `NEXTAUTH_SECRET` random:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output-nya ke `NEXTAUTH_SECRET`.

---

## 3. Setup PostgreSQL dari nol (fix P1010/P3014)

Aktifkan service PostgreSQL:

```bash
sudo systemctl enable --now postgresql
sudo systemctl status postgresql --no-pager
```

### 3.1 Buat / update role `sidesa` (dengan CREATEDB)

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

### 3.2 Buat database jika belum ada

```bash
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='sidesa_db'" | grep -q 1 || \
sudo -u postgres createdb -O sidesa sidesa_db
```

### 3.3 Grant privilege ke role app

```bash
sudo -u postgres psql -d sidesa_db -v ON_ERROR_STOP=1 <<'SQL'
GRANT ALL PRIVILEGES ON DATABASE sidesa_db TO sidesa;
GRANT ALL ON SCHEMA public TO sidesa;
ALTER SCHEMA public OWNER TO sidesa;
SQL
```

### 3.4 Verifikasi koneksi database

```bash
psql "postgresql://sidesa:sidesa_password@localhost:5432/sidesa_db" -c "SELECT current_user, current_database();"
```

Output yang benar: user `sidesa`, database `sidesa_db`.

---

## 4. Install dependency dan generate Prisma client

```bash
npm install
npx prisma generate
```

---

## 5. Jalankan migration + seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Kalau berhasil, akan muncul summary data seed (user, desa, penduduk, surat, mutasi, dll).

---

## 6. Jalankan aplikasi local

```bash
npm run dev
```

Buka `http://localhost:3000`.

Login seed default:

1. `admin / Admin@2026`
2. `kades / User@2026`
3. `sekdes / User@2026`
4. `operator / User@2026`

---

## 7. Quality check (wajib clean)

Jalankan semua:

```bash
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
```

Kalau pernah kena `Bus error (core dumped)` saat build:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 8. Deploy manual di VPS (tanpa GitHub Actions dulu, paling aman untuk pemula)

SSH ke VPS:

```bash
ssh <user>@<ip-vps>
```

Install tool dasar di VPS (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

Clone project:

```bash
git clone https://github.com/Faiz-abdurrachman/SIKD.git
cd SIKD/sidesa
```

Siapkan env produksi:

```bash
cp .env.example .env
nano .env
```

Minimal ubah `NEXTAUTH_SECRET` jadi random kuat.

Deploy:

```bash
bash scripts/deploy.sh
```

Lihat status container:

```bash
docker compose -f docker/docker-compose.yml ps
```

---

## 9. Deploy via GitHub Actions (otomatis saat push ke `main`)

Workflow pakai file: `.github/workflows/deploy.yml`

Wajib isi **Repository Secrets** di GitHub:

1. `VPS_HOST` -> IP/domain VPS (contoh `103.xxx.xxx.xxx`)
2. `VPS_USER` -> user SSH di VPS (contoh `ubuntu`)
3. `VPS_SSH_KEY` -> private key SSH (isi full mulai `-----BEGIN...` sampai `-----END...`)
4. `VPS_PROJECT_PATH` -> path project di VPS (contoh `/home/ubuntu/SIKD/sidesa`)

### Cara isi secret di GitHub

1. Buka repo GitHub `SIKD`
2. `Settings` -> `Secrets and variables` -> `Actions`
3. Klik `New repository secret`
4. Tambahkan 4 secret di atas satu per satu

### Kalau error `missing server host`

Itu artinya `VPS_HOST` kosong/salah nama.  
Nama secret harus **persis** sama dengan workflow.

---

## 10. Setup SSH key khusus GitHub Actions (recommended)

Di local:

```bash
ssh-keygen -t ed25519 -C "github-actions-sidesa" -f ~/.ssh/sidesa_actions
```

Lihat public key:

```bash
cat ~/.ssh/sidesa_actions.pub
```

Masuk ke VPS, tambahkan ke `authorized_keys` user deploy:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Paste isi `.pub` ke `authorized_keys`.

Lalu untuk secret `VPS_SSH_KEY`, isi dari:

```bash
cat ~/.ssh/sidesa_actions
```

Yang dipakai secret adalah **private key** (tanpa `.pub`).

---

## 11. Backup dan restore database

Backup:

```bash
npm run backup:db
```

Restore:

```bash
npm run restore:db -- ./backups/<nama-file>.sql.gz
```

---

## 12. Troubleshooting cepat

### A. Error `P1010: User was denied access`

Periksa:

1. `DATABASE_URL` benar (user/password/db)
2. Role `sidesa` ada
3. Grant ke database/schema sudah dijalankan

### B. Error `P3014: permission denied to create database`

Jalankan:

```bash
sudo -u postgres psql -c "ALTER ROLE sidesa CREATEDB;"
```

### C. Terminal jadi `>` terus saat pakai heredoc

Penyebab: penutup heredoc belum benar.  
Untuk blok `<<'SQL'`, baris akhir harus tepat:

```bash
SQL
```

Tanpa spasi depan/belakang.

### D. Build gagal random

Pakai reset dependency:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 13. Checklist final (harus centang semua)

1. [ ] `npx prisma migrate dev --name init` sukses
2. [ ] `npx prisma db seed` sukses
3. [ ] `npm run build` sukses
4. [ ] Login app local berhasil
5. [ ] Secrets GitHub sudah lengkap 4 item
6. [ ] Workflow deploy hijau

Kalau semua centang, setup kamu sudah complete.
