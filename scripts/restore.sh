#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker/docker-compose.yml"
BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: bash scripts/restore.sh <path-backup.sql|path-backup.sql.gz>"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: File backup tidak ditemukan: $BACKUP_FILE"
  exit 1
fi

run_input_command() {
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE"
  else
    cat "$BACKUP_FILE"
  fi
}

if command -v docker >/dev/null 2>&1 && docker compose -f "$COMPOSE_FILE" ps db >/dev/null 2>&1; then
  POSTGRES_USER_VALUE="${POSTGRES_USER:-sidesa}"
  POSTGRES_DB_VALUE="${POSTGRES_DB:-sidesa_db}"

  echo "[restore] Using docker postgres service"
  run_input_command | docker compose -f "$COMPOSE_FILE" exec -T db \
    psql -U "$POSTGRES_USER_VALUE" "$POSTGRES_DB_VALUE"
else
  DATABASE_URL_VALUE="${DATABASE_URL:-}"

  if [[ -z "$DATABASE_URL_VALUE" ]]; then
    echo "ERROR: DATABASE_URL belum di-set dan service docker db tidak aktif"
    exit 1
  fi

  if ! command -v psql >/dev/null 2>&1; then
    echo "ERROR: psql tidak ditemukan di PATH"
    exit 1
  fi

  echo "[restore] Using DATABASE_URL"
  run_input_command | psql "$DATABASE_URL_VALUE"
fi

echo "[restore] Selesai"
