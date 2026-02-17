#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL_VALUE="${DATABASE_URL:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-${1:-7}}"

if [[ -z "$DATABASE_URL_VALUE" ]]; then
  echo "ERROR: DATABASE_URL belum di-set"
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump tidak ditemukan di PATH"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
OUT_FILE="$BACKUP_DIR/sidesa-$TIMESTAMP.sql.gz"

echo "[backup] Membuat backup ke $OUT_FILE"
pg_dump "$DATABASE_URL_VALUE" | gzip > "$OUT_FILE"

echo "[backup] Membersihkan file lama > ${RETENTION_DAYS} hari"
find "$BACKUP_DIR" -maxdepth 1 -type f -name "*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] Selesai"
