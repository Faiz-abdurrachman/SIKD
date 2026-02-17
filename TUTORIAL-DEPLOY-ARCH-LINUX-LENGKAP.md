# Tutorial Deploy SIDESA di Arch Linux (Opsional VPS Self-Hosting)

Dokumen ini dibuat untuk pemula total. Ikuti urutan dari atas ke bawah, jangan lompat step.
Gunakan panduan ini jika kamu memang memilih mode VPS; untuk mode paling cepat dan hemat, pakai `TUTORIAL-VERCEL-0-SAMPAI-LIVE.md`.

Tujuan akhir:
1. Aplikasi SIDESA bisa jalan di VPS Arch Linux.
2. Deploy manual sukses.
3. Deploy otomatis via GitHub Actions sukses.
4. Kamu paham cara cek error dan benerinnya.

---

## 0) Gambaran Besar (Biar Tidak Bingung)

Flow deploy project ini:
1. Kamu `git push` ke branch `main`.
2. GitHub Actions workflow `deploy.yml` jalan.
3. GitHub Actions SSH ke VPS.
4. Di VPS, script `scripts/deploy.sh` dijalankan:
   - `git pull origin main`
   - `docker compose build`
   - `docker compose run --rm app npx prisma migrate deploy`
   - `docker compose up -d`

Artinya, kalau deploy gagal, biasanya masalah ada di:
1. Secret GitHub salah / kosong.
2. SSH key salah.
3. Path project di VPS salah.
4. Docker atau env di VPS belum siap.

---

## 1) Prasyarat

### 1.1 Perangkat
1. Local laptop/PC Arch Linux (tempat kamu push ke GitHub).
2. VPS Arch Linux (server deploy).
3. Repo GitHub sudah terhubung ke project.

### 1.2 Data yang harus kamu tahu
1. IP/domain VPS (contoh `103.xx.xx.xx`).
2. Username login VPS (contoh `faiz` atau `root`).
3. Path project di VPS (nanti kita buat, contoh `/home/faiz/SIKD/sidesa`).

---

## 2) Setup VPS Arch Linux (Wajib, Sekali Saja)

Masuk ke VPS via SSH dari local:

```bash
ssh <VPS_USER>@<VPS_HOST>
```

Contoh:

```bash
ssh faiz@103.10.10.10
```

Setelah masuk VPS, jalankan:

```bash
sudo pacman -Syu --noconfirm
sudo pacman -S --needed git docker openssh
sudo systemctl enable --now docker
sudo systemctl enable --now sshd
sudo usermod -aG docker $USER
```

Lalu **logout** dari VPS dan login lagi (wajib, supaya group docker kebaca):

```bash
exit
ssh <VPS_USER>@<VPS_HOST>
```

Cek install:

```bash
docker --version
docker compose version
git --version
```

Kalau command di atas keluar versi, lanjut.

---

## 3) Clone Project di VPS

Di VPS:

```bash
cd ~
git clone https://github.com/Faiz-abdurrachman/SIKD.git
cd ~/SIKD/sidesa
```

Verifikasi file penting ada:

```bash
ls -la
ls -la scripts/deploy.sh
ls -la docker/docker-compose.yml
```

---

## 4) Buat File Environment Production di VPS

Di VPS:

```bash
cd ~/SIKD/sidesa
cp .env.example .env
openssl rand -hex 32
```

Copy hasil `openssl` untuk `NEXTAUTH_SECRET`.

Edit `.env` (cara cepat copy-paste):

```bash
cat > .env <<'EOF'
POSTGRES_DB=sidesa_db
POSTGRES_USER=sidesa
POSTGRES_PASSWORD=GANTI_PASSWORD_DB_KUAT

NEXTAUTH_SECRET=PASTE_HASIL_OPENSSL_64_HEX
NEXTAUTH_URL=http://IP_ATAU_DOMAIN_KAMU

NEXT_PUBLIC_APP_NAME=SIDESA
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DESA_NAME=Desa Sukamaju
MAX_FILE_SIZE=5242880
EOF
```

Contoh `NEXTAUTH_URL`:
1. Kalau belum ada domain: `http://103.10.10.10`
2. Kalau sudah ada domain: `http://app.domainkamu.com` (HTTPS dibahas belakangan)

---

## 5) Deploy Manual Pertama (Sangat Penting)

Sebelum auto deploy GitHub, kamu wajib tes deploy manual.

Di VPS:

```bash
cd ~/SIKD/sidesa
bash scripts/deploy.sh
```

Kalau sukses, cek status:

```bash
docker compose -f docker/docker-compose.yml ps
```

Cek log app:

```bash
docker compose -f docker/docker-compose.yml logs --tail=200 app
```

Cek log nginx:

```bash
docker compose -f docker/docker-compose.yml logs --tail=200 nginx
```

Tes dari local browser:
1. Buka `http://<VPS_HOST>`
2. Pastikan halaman login SIDESA muncul.

Kalau deploy manual belum sukses, jangan lanjut ke GitHub Actions dulu.

---

## 6) Buat SSH Key Khusus untuk GitHub Actions

Key ini dibuat di **local Arch Linux** kamu (bukan di VPS).

Di local:

```bash
ssh-keygen -t ed25519 -C "github-actions-sidesa" -f ~/.ssh/sidesa_actions_key -N ""
```

Lihat public key:

```bash
cat ~/.ssh/sidesa_actions_key.pub
```

Copy output `.pub`.

---

## 7) Pasang Public Key ke VPS

Masuk VPS:

```bash
ssh <VPS_USER>@<VPS_HOST>
```

Lalu jalankan:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_PUBLIC_KEY_DI_SINI" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Sekarang tes dari local:

```bash
ssh -i ~/.ssh/sidesa_actions_key <VPS_USER>@<VPS_HOST> "echo SSH_OK"
```

Kalau output `SSH_OK`, berarti key valid.

---

## 8) Isi GitHub Secrets (Ini Kunci Auto Deploy)

Buka GitHub repo `SIKD`:
1. `Settings`
2. `Secrets and variables`
3. `Actions`
4. Klik `New repository secret`

Isi 4 secret ini **dengan nama persis**:

1. `VPS_HOST`
   - Isi: IP/domain VPS.
   - Contoh: `103.10.10.10`

2. `VPS_USER`
   - Isi: username SSH VPS.
   - Contoh: `faiz`

3. `VPS_PROJECT_PATH`
   - Isi: path folder project `sidesa` di VPS.
   - Contoh: `/home/faiz/SIKD/sidesa`

4. `VPS_SSH_KEY`
   - Isi: private key dari local:
   ```bash
   cat ~/.ssh/sidesa_actions_key
   ```
   - Copy dari:
     - `-----BEGIN OPENSSH PRIVATE KEY-----`
     - sampai `-----END OPENSSH PRIVATE KEY-----`

Catatan:
1. Jangan tambah spasi aneh di awal/akhir value.
2. Jangan salah nama secret. Harus persis.

---

## 9) Trigger Auto Deploy

Setelah secret beres, dari local project kamu:

```bash
cd /home/faiz/projek/terbaru/sidesa
git commit --allow-empty -m "chore: trigger deploy"
git push origin main
```

Lalu cek GitHub:
1. Masuk tab `Actions`
2. Buka workflow `Deploy`
3. Pantau job sampai status hijau.

---

## 10) Cara Baca Error Deploy (Mapping Cepat)

### 10.1 Error: `missing server host`
Penyebab:
1. Secret `VPS_HOST` kosong.
2. Nama secret salah.

Perbaikan:
1. Buka GitHub Secrets.
2. Pastikan `VPS_HOST` ada dan tidak kosong.

### 10.2 Error: `permission denied (publickey)`
Penyebab:
1. Isi `VPS_SSH_KEY` salah.
2. Public key belum masuk `authorized_keys`.
3. Permission file `.ssh` salah.

Perbaikan:
1. Ulang step keygen + pasang key.
2. Pastikan:
   - `chmod 700 ~/.ssh`
   - `chmod 600 ~/.ssh/authorized_keys`
3. Tes manual:
```bash
ssh -i ~/.ssh/sidesa_actions_key <VPS_USER>@<VPS_HOST> "echo SSH_OK"
```

### 10.3 Error: `cd: ... No such file or directory`
Penyebab:
1. `VPS_PROJECT_PATH` salah.

Perbaikan:
1. SSH ke VPS.
2. Cek path real:
```bash
pwd
ls -la /home/<VPS_USER>/SIKD/sidesa
```
3. Update secret `VPS_PROJECT_PATH`.

### 10.4 Error: `docker: command not found`
Penyebab:
1. Docker belum terpasang di VPS.

Perbaikan:
```bash
sudo pacman -S --needed docker
sudo systemctl enable --now docker
```

### 10.5 Error: `permission denied while trying to connect to the Docker daemon socket`
Penyebab:
1. User belum masuk group docker.

Perbaikan:
```bash
sudo usermod -aG docker <VPS_USER>
```
Lalu logout/login SSH lagi.

### 10.6 Error Prisma migrate di deploy
Penyebab:
1. DB env salah (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).
2. Container db belum healthy.

Perbaikan:
1. Cek `.env` di VPS.
2. Cek log db:
```bash
docker compose -f docker/docker-compose.yml logs --tail=200 db
```

---

## 11) Command Operasional Harian

Di VPS, masuk folder project dulu:

```bash
cd ~/SIKD/sidesa
```

Lihat status container:

```bash
docker compose -f docker/docker-compose.yml ps
```

Lihat log app realtime:

```bash
docker compose -f docker/docker-compose.yml logs -f app
```

Restart app saja:

```bash
docker compose -f docker/docker-compose.yml restart app
```

Deploy manual update terbaru:

```bash
bash scripts/deploy.sh
```

---

## 12) Rollback Cepat Kalau Rilis Bermasalah

Di VPS:

```bash
cd ~/SIKD/sidesa
git log --oneline -n 10
```

Pilih commit lama yang stabil, lalu:

```bash
git checkout <COMMIT_STABIL>
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d
```

Kalau mau kembali ke main terbaru:

```bash
git checkout main
git pull origin main
bash scripts/deploy.sh
```

---

## 13) Checklist Selesai Deploy

Checklist akhir:
1. `docker compose ps` menunjukkan `db`, `app`, `nginx` status `Up`.
2. Website bisa dibuka dari browser.
3. Bisa login pakai akun seed.
4. Workflow `CI Smoke` hijau.
5. Workflow `Deploy` hijau.
6. Tidak ada error merah terus-menerus di log app/nginx.

Kalau semua ini sudah oke, deploy kamu sudah benar.

---

## 14) Validasi Cepat (Copy-Paste Satu Paket)

Pakai ini kalau kamu mau cek kondisi server dengan cepat:

```bash
cd ~/SIKD/sidesa
echo "== USER ==" && whoami
echo "== DOCKER ==" && docker --version
echo "== COMPOSE ==" && docker compose version
echo "== PROJECT ==" && pwd
echo "== GIT BRANCH ==" && git branch --show-current
echo "== GIT LAST COMMIT ==" && git log --oneline -n 1
echo "== CONTAINERS ==" && docker compose -f docker/docker-compose.yml ps
```

---

## 15) Catatan Penting Keamanan

1. Ganti `POSTGRES_PASSWORD` dengan password kuat.
2. Jangan share nilai `VPS_SSH_KEY` ke siapapun.
3. Jangan commit file `.env` ke Git.
4. Kalau nanti sudah siap domain + SSL, upgrade `NEXTAUTH_URL` jadi `https://...`.
5. Rutin cek update security Arch:

```bash
sudo pacman -Syu
```
