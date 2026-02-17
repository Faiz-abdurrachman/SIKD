#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL_VALUE="${DATABASE_URL:-}"
BACKUP_FILE="${1:-}"

if [[ -z "$DATABASE_URL_VALUE" ]]; then
  echo "ERROR: DATABASE_URL belum di-set"
  exit 1
fi

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: bash scripts/restore.sh <path-backup.sql|path-backup.sql.gz>"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: File backup tidak ditemukan: $BACKUP_FILE"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql tidak ditemukan di PATH"
  exit 1
fi

echo "[restore] Restore dari $BACKUP_FILE"

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL_VALUE"
else
  psql "$DATABASE_URL_VALUE" < "$BACKUP_FILE"
fi

echo "[restore] Selesai"
