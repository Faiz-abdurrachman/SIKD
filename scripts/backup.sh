#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker/docker-compose.yml"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-${1:-7}}"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
OUT_FILE="$BACKUP_DIR/sidesa-$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Target file: $OUT_FILE"

if command -v docker >/dev/null 2>&1 && docker compose -f "$COMPOSE_FILE" ps db >/dev/null 2>&1; then
  POSTGRES_USER_VALUE="${POSTGRES_USER:-sidesa}"
  POSTGRES_DB_VALUE="${POSTGRES_DB:-sidesa_db}"

  echo "[backup] Using docker postgres service"
  docker compose -f "$COMPOSE_FILE" exec -T db \
    pg_dump -U "$POSTGRES_USER_VALUE" "$POSTGRES_DB_VALUE" | gzip > "$OUT_FILE"
else
  DATABASE_URL_VALUE="${DATABASE_URL:-}"

  if [[ -z "$DATABASE_URL_VALUE" ]]; then
    echo "ERROR: DATABASE_URL belum di-set dan service docker db tidak aktif"
    exit 1
  fi

  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "ERROR: pg_dump tidak ditemukan di PATH"
    exit 1
  fi

  echo "[backup] Using DATABASE_URL"
  pg_dump "$DATABASE_URL_VALUE" | gzip > "$OUT_FILE"
fi

echo "[backup] Membersihkan file lama > ${RETENTION_DAYS} hari"
find "$BACKUP_DIR" -maxdepth 1 -type f -name "*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] Selesai"
