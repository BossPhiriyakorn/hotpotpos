#!/usr/bin/env bash
set -euo pipefail
BACKEND_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BACKEND_ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

DB_NAME="${DB_NAME:-hotpot_kiosk_db}"
SQL_FILE="$BACKEND_ROOT/scripts/verify_kbank_schema.sql"

if command -v sudo >/dev/null 2>&1 && id postgres >/dev/null 2>&1; then
  sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
else
  echo "❌ ใช้คู่มือใน verify_kbank_schema.sql หัวไฟล์ — รันด้วย psql + user ที่เข้าถึง DB ได้"
  exit 1
fi
