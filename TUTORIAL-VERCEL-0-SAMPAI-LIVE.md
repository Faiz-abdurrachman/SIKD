# Tutorial SIDESA ke Vercel (Dari Nol, Tanpa VPS)

Dokumen ini fokus buat kamu yang belum pernah deploy.
Target: aplikasi online tanpa harus sewa VPS dulu.

---

## 0) Konsep Simpel (Wajib Paham Dulu)

Aplikasi ini butuh 2 komponen:
1. App Next.js (frontend + API route)
2. Database PostgreSQL

Kalau pakai Vercel:
1. App jalan di Vercel.
2. Database pakai layanan PostgreSQL managed (contoh: Neon/Supabase/Railway).

Artinya:
1. Kamu tidak perlu setup Docker + Nginx + server VPS dulu.
2. Fokus kamu cukup: set env, migrate DB, deploy.

---

## 1) Checklist Sebelum Mulai

Pastikan:
1. Repo GitHub kamu sudah update terbaru.
2. Local project jalan normal (`npm run dev` bisa).
3. Kamu punya akun:
   - GitHub
   - Vercel
   - salah satu provider PostgreSQL managed

---

## 2) Pastikan Local Project Bersih

Di local:

```bash
cd /path/ke/SIKD
git checkout main
git pull origin main
npm install
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
```

Kalau semua lolos, lanjut.

---

## 3) Buat Database PostgreSQL Managed

Pilih salah satu:
1. Neon
2. Supabase
3. Railway

Yang kamu butuh hanya 1 nilai:
1. `DATABASE_URL`

Format umumnya seperti ini:

```env
postgresql://user:password@host:5432/dbname?sslmode=require
```

Catatan:
1. Jangan pakai `localhost` untuk production Vercel.
2. Simpan URL ini baik-baik, nanti dipakai di beberapa tempat.

---

## 4) Jalankan Migration ke Database Production

Migration wajib agar tabel di DB production dibuat sesuai schema Prisma.

Di local, jalankan:

```bash
cd /path/ke/SIKD
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require" npx prisma migrate deploy
```

Jika kamu mau isi data awal (akun seed) di DB production:

```bash
cd /path/ke/SIKD
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require" npx prisma db seed
```

Verifikasi akun seed (opsional):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require" npm run verify:seed-users
```

---

## 5) Hubungkan Repo ke Vercel

Langkah di dashboard Vercel:
1. Login Vercel.
2. Klik `Add New...` -> `Project`.
3. Import repo `Faiz-abdurrachman/SIKD`.
4. Saat konfigurasi project:
   - Framework: Next.js (auto detect)
   - Root Directory: `./` (root repo `SIKD`)
   - Install Command: `npm install`
   - Build Command: `npm run vercel-build`
   - Output Directory: biarkan default

Kenapa `npm run vercel-build`?
1. Script ini memastikan `prisma generate` + `next build`.
2. Mengurangi risiko error Prisma Client di build.

---

## 6) Isi Environment Variables di Vercel

Di Vercel project -> Settings -> Environment Variables:

Wajib:
1. `DATABASE_URL` = connection string DB managed
2. `NEXTAUTH_SECRET` = random string panjang (minimal 32 char)
3. `NEXTAUTH_URL` = domain Vercel app kamu (format `https://...`)

Direkomendasikan:
1. `NEXT_PUBLIC_APP_NAME=SIDESA`
2. `NEXT_PUBLIC_APP_VERSION=1.0.0`
3. `NEXT_PUBLIC_DESA_NAME=Desa Sukamaju`

Cara bikin secret random dari local:

```bash
openssl rand -hex 32
```

---

## 7) Deploy Pertama di Vercel

Setelah env diisi:
1. Klik `Deploy` (atau `Redeploy`).
2. Tunggu build selesai.
3. Jika sukses, Vercel kasih URL aplikasi (contoh `https://nama-app.vercel.app`).

Setelah live:
1. Buka URL.
2. Coba login pakai akun seed.
3. Cek halaman utama: `/`, `/penduduk`, `/keluarga`, `/surat`, `/mutasi`.

---

## 8) Domain Custom (Opsional)

Kalau kamu punya domain:
1. Buka Vercel -> Project -> Settings -> Domains
2. Tambah domain kamu.
3. Ikuti instruksi DNS record dari Vercel.
4. Setelah aktif, update env `NEXTAUTH_URL` ke domain custom kamu.
5. Redeploy sekali.

---

## 9) Cara Update Aplikasi Setelah Ini

Flow harian:
1. Ubah kode di local.
2. Test lokal.
3. `git commit` + `git push origin main`.
4. Vercel otomatis build + deploy versi baru.

Kalau gagal, buka tab `Deployments` di Vercel untuk lihat log.

---

## 10) Debug Error yang Paling Sering

### 10.1 Error login/session (Auth)
Biasanya:
1. `NEXTAUTH_SECRET` kosong/salah.
2. `NEXTAUTH_URL` bukan URL production yang benar.

Fix:
1. Set ulang env di Vercel.
2. Redeploy.

### 10.2 Error database connection
Biasanya:
1. `DATABASE_URL` salah.
2. Host/port/dbname typo.
3. Wajib SSL tapi URL belum `sslmode=require`.

Fix:
1. Copy ulang `DATABASE_URL` dari provider.
2. Simpan ulang di Vercel.
3. Redeploy.

### 10.3 Error tabel belum ada
Biasanya migration belum dijalankan ke DB production.

Fix:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 10.4 Build gagal karena Prisma Client
Fix:
1. Pastikan build command pakai `npm run vercel-build`.
2. Pastikan script `postinstall` ada dan menjalankan `prisma generate`.
3. Redeploy.

### 10.5 Seed user tidak bisa login
Urutan cek:
1. Pastikan seed jalan ke DB production yang sama dengan `DATABASE_URL` Vercel.
2. Cek pakai:
```bash
DATABASE_URL="postgresql://..." npm run verify:seed-users
```
3. Login pakai `username`, bukan email.

---

## 11) Tentang Upload File di Vercel

Penting:
1. Storage filesystem lokal Vercel tidak persisten untuk jangka panjang.
2. Untuk upload permanen, gunakan object storage (Cloudinary/S3/R2/Supabase Storage).

Untuk saat ini, jika fitur upload belum dipakai berat, masih aman lanjut deploy.

---

## 12) Kalau Mau Balik ke VPS

Kamu sudah punya backup aman:
1. Branch: `backup/pre-vercel-migration-20260217`
2. Tag: `backup-pre-vercel-migration-20260217`

Cara checkout backup:

```bash
git checkout backup/pre-vercel-migration-20260217
```

Atau:

```bash
git checkout backup-pre-vercel-migration-20260217
```

---

## 13) Checklist Done

Checklist final:
1. Build local lolos.
2. DB managed sudah dibuat.
3. `prisma migrate deploy` ke DB production sukses.
4. Env di Vercel sudah lengkap.
5. Deploy Vercel sukses.
6. Bisa login dan buka modul utama tanpa error.

Kalau semua checklist ini centang, berarti migrasi kamu ke Vercel sudah beres.
