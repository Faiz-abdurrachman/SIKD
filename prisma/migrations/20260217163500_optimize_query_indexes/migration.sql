-- Drop redundant non-unique indexes already covered by unique constraints
DROP INDEX IF EXISTS "keluarga_no_kk_idx";
DROP INDEX IF EXISTS "penduduk_nik_idx";
DROP INDEX IF EXISTS "surat_nomor_surat_idx";

-- Users
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_is_active_idx" ON "users"("is_active");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at");
CREATE INDEX IF NOT EXISTS "users_last_login_at_idx" ON "users"("last_login_at");

-- Keluarga
CREATE INDEX IF NOT EXISTS "keluarga_rt_id_idx" ON "keluarga"("rt_id");
CREATE INDEX IF NOT EXISTS "keluarga_created_at_idx" ON "keluarga"("created_at");
CREATE INDEX IF NOT EXISTS "keluarga_updated_at_idx" ON "keluarga"("updated_at");

-- Penduduk
CREATE INDEX IF NOT EXISTS "penduduk_status_kependudukan_idx" ON "penduduk"("status_kependudukan");
CREATE INDEX IF NOT EXISTS "penduduk_tanggal_lahir_idx" ON "penduduk"("tanggal_lahir");
CREATE INDEX IF NOT EXISTS "penduduk_created_at_idx" ON "penduduk"("created_at");
CREATE INDEX IF NOT EXISTS "penduduk_updated_at_idx" ON "penduduk"("updated_at");
CREATE INDEX IF NOT EXISTS "penduduk_status_kependudukan_nama_idx" ON "penduduk"("status_kependudukan", "nama");
CREATE INDEX IF NOT EXISTS "penduduk_keluarga_id_nama_idx" ON "penduduk"("keluarga_id", "nama");

-- Surat
CREATE INDEX IF NOT EXISTS "surat_created_at_idx" ON "surat"("created_at");
CREATE INDEX IF NOT EXISTS "surat_updated_at_idx" ON "surat"("updated_at");
CREATE INDEX IF NOT EXISTS "surat_status_tanggal_surat_idx" ON "surat"("status", "tanggal_surat");
CREATE INDEX IF NOT EXISTS "surat_jenis_surat_tanggal_surat_idx" ON "surat"("jenis_surat", "tanggal_surat");
CREATE INDEX IF NOT EXISTS "surat_created_by_id_idx" ON "surat"("created_by_id");

-- Surat Penduduk
CREATE INDEX IF NOT EXISTS "surat_penduduk_penduduk_id_idx" ON "surat_penduduk"("penduduk_id");
CREATE INDEX IF NOT EXISTS "surat_penduduk_surat_id_idx" ON "surat_penduduk"("surat_id");

-- Mutasi
CREATE INDEX IF NOT EXISTS "mutasi_penduduk_id_idx" ON "mutasi"("penduduk_id");
CREATE INDEX IF NOT EXISTS "mutasi_created_at_idx" ON "mutasi"("created_at");
CREATE INDEX IF NOT EXISTS "mutasi_jenis_mutasi_tanggal_mutasi_idx" ON "mutasi"("jenis_mutasi", "tanggal_mutasi");

-- Audit logs
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_created_at_idx" ON "audit_logs"("entity", "created_at");
