#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker belum terpasang"
  exit 1
fi

cd "$PROJECT_DIR"

echo "[deploy] Pull latest code"
git pull origin main

echo "[deploy] Build image"
docker compose -f "$COMPOSE_FILE" build

echo "[deploy] Apply migration"
docker compose -f "$COMPOSE_FILE" run --rm app npx prisma migrate deploy

echo "[deploy] Start services"
docker compose -f "$COMPOSE_FILE" up -d

echo "[deploy] Status"
docker compose -f "$COMPOSE_FILE" ps


echo "[deploy] Done"
