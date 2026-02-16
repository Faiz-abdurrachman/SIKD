-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'KEPALA_DESA', 'SEKRETARIS', 'OPERATOR');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "Agama" AS ENUM ('ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'KEPERCAYAAN');

-- CreateEnum
CREATE TYPE "StatusPerkawinan" AS ENUM ('BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI');

-- CreateEnum
CREATE TYPE "StatusHubunganKeluarga" AS ENUM ('KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU', 'ORANG_TUA', 'MERTUA', 'FAMILI_LAIN', 'PEMBANTU', 'LAINNYA');

-- CreateEnum
CREATE TYPE "GolonganDarah" AS ENUM ('A', 'B', 'AB', 'O', 'TIDAK_TAHU');

-- CreateEnum
CREATE TYPE "StatusKependudukan" AS ENUM ('TETAP', 'SEMENTARA', 'PINDAH', 'MENINGGAL');

-- CreateEnum
CREATE TYPE "Pendidikan" AS ENUM ('TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3');

-- CreateEnum
CREATE TYPE "JenisSurat" AS ENUM ('SK_DOMISILI', 'SK_TIDAK_MAMPU', 'SK_USAHA', 'SK_KELAHIRAN', 'SK_KEMATIAN', 'SK_PINDAH', 'SK_DATANG', 'SK_BELUM_MENIKAH', 'SK_BEDA_NAMA', 'SK_KEHILANGAN', 'SK_CATATAN_KEPOLISIAN', 'SURAT_PENGANTAR', 'SK_TANAH', 'SK_PENGHASILAN', 'SK_IZIN_KERAMAIAN', 'LAINNYA');

-- CreateEnum
CREATE TYPE "StatusSurat" AS ENUM ('DRAFT', 'MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DITOLAK', 'DICETAK', 'SELESAI');

-- CreateEnum
CREATE TYPE "JenisMutasi" AS ENUM ('LAHIR', 'MATI', 'PINDAH_KELUAR', 'PINDAH_MASUK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desa" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "kode_pos" TEXT,
    "alamat_kantor" TEXT,
    "telepon" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "nama_kepala_desa" TEXT,
    "nip_kepala_desa" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dusun" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "desa_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dusun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rw" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "dusun_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rt" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "rw_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keluarga" (
    "id" TEXT NOT NULL,
    "no_kk" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "rt_id" TEXT NOT NULL,
    "kepala_keluarga_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keluarga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penduduk" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tempat_lahir" TEXT NOT NULL,
    "tanggal_lahir" TIMESTAMP(3) NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "agama" "Agama" NOT NULL,
    "status_perkawinan" "StatusPerkawinan" NOT NULL,
    "pendidikan_terakhir" "Pendidikan" NOT NULL,
    "pekerjaan" TEXT NOT NULL,
    "golongan_darah" "GolonganDarah",
    "status_hubungan" "StatusHubunganKeluarga" NOT NULL,
    "nama_ayah" TEXT,
    "nama_ibu" TEXT,
    "kewarganegaraan" TEXT NOT NULL DEFAULT 'WNI',
    "status_kependudukan" "StatusKependudukan" NOT NULL DEFAULT 'TETAP',
    "foto" TEXT,
    "telepon" TEXT,
    "catatan" TEXT,
    "keluarga_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penduduk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surat" (
    "id" TEXT NOT NULL,
    "nomor_surat" TEXT NOT NULL,
    "jenis_surat" "JenisSurat" NOT NULL,
    "perihal" TEXT NOT NULL,
    "tanggal_surat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isi_surat" JSONB,
    "keterangan" TEXT,
    "status" "StatusSurat" NOT NULL DEFAULT 'DRAFT',
    "alasan_tolak" TEXT,
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "printed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surat_penduduk" (
    "id" TEXT NOT NULL,
    "surat_id" TEXT NOT NULL,
    "penduduk_id" TEXT NOT NULL,
    "peran" TEXT NOT NULL DEFAULT 'pemohon',

    CONSTRAINT "surat_penduduk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nomor_surat_counter" (
    "id" TEXT NOT NULL,
    "jenis_surat" "JenisSurat" NOT NULL,
    "tahun" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "nomor_surat_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutasi" (
    "id" TEXT NOT NULL,
    "jenis_mutasi" "JenisMutasi" NOT NULL,
    "penduduk_id" TEXT NOT NULL,
    "tanggal_mutasi" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "alamat_tujuan" TEXT,
    "alamat_asal" TEXT,
    "alasan_pindah" TEXT,
    "tempat_lahir_mutasi" TEXT,
    "nama_ayah_mutasi" TEXT,
    "nama_ibu_mutasi" TEXT,
    "penyebab_kematian" TEXT,
    "tempat_kematian" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mutasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "desa_kode_key" ON "desa"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "dusun_desa_id_nama_key" ON "dusun"("desa_id", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "rw_dusun_id_nomor_key" ON "rw"("dusun_id", "nomor");

-- CreateIndex
CREATE UNIQUE INDEX "rt_rw_id_nomor_key" ON "rt"("rw_id", "nomor");

-- CreateIndex
CREATE UNIQUE INDEX "keluarga_no_kk_key" ON "keluarga"("no_kk");

-- CreateIndex
CREATE UNIQUE INDEX "keluarga_kepala_keluarga_id_key" ON "keluarga"("kepala_keluarga_id");

-- CreateIndex
CREATE INDEX "keluarga_no_kk_idx" ON "keluarga"("no_kk");

-- CreateIndex
CREATE UNIQUE INDEX "penduduk_nik_key" ON "penduduk"("nik");

-- CreateIndex
CREATE INDEX "penduduk_nik_idx" ON "penduduk"("nik");

-- CreateIndex
CREATE INDEX "penduduk_nama_idx" ON "penduduk"("nama");

-- CreateIndex
CREATE INDEX "penduduk_keluarga_id_idx" ON "penduduk"("keluarga_id");

-- CreateIndex
CREATE UNIQUE INDEX "surat_nomor_surat_key" ON "surat"("nomor_surat");

-- CreateIndex
CREATE INDEX "surat_nomor_surat_idx" ON "surat"("nomor_surat");

-- CreateIndex
CREATE INDEX "surat_jenis_surat_idx" ON "surat"("jenis_surat");

-- CreateIndex
CREATE INDEX "surat_status_idx" ON "surat"("status");

-- CreateIndex
CREATE INDEX "surat_tanggal_surat_idx" ON "surat"("tanggal_surat");

-- CreateIndex
CREATE UNIQUE INDEX "surat_penduduk_surat_id_penduduk_id_peran_key" ON "surat_penduduk"("surat_id", "penduduk_id", "peran");

-- CreateIndex
CREATE UNIQUE INDEX "nomor_surat_counter_jenis_surat_tahun_key" ON "nomor_surat_counter"("jenis_surat", "tahun");

-- CreateIndex
CREATE INDEX "mutasi_jenis_mutasi_idx" ON "mutasi"("jenis_mutasi");

-- CreateIndex
CREATE INDEX "mutasi_tanggal_mutasi_idx" ON "mutasi"("tanggal_mutasi");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dusun" ADD CONSTRAINT "dusun_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rw" ADD CONSTRAINT "rw_dusun_id_fkey" FOREIGN KEY ("dusun_id") REFERENCES "dusun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rt" ADD CONSTRAINT "rt_rw_id_fkey" FOREIGN KEY ("rw_id") REFERENCES "rw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keluarga" ADD CONSTRAINT "keluarga_rt_id_fkey" FOREIGN KEY ("rt_id") REFERENCES "rt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keluarga" ADD CONSTRAINT "keluarga_kepala_keluarga_id_fkey" FOREIGN KEY ("kepala_keluarga_id") REFERENCES "penduduk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penduduk" ADD CONSTRAINT "penduduk_keluarga_id_fkey" FOREIGN KEY ("keluarga_id") REFERENCES "keluarga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat_penduduk" ADD CONSTRAINT "surat_penduduk_surat_id_fkey" FOREIGN KEY ("surat_id") REFERENCES "surat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat_penduduk" ADD CONSTRAINT "surat_penduduk_penduduk_id_fkey" FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi" ADD CONSTRAINT "mutasi_penduduk_id_fkey" FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
