#!/usr/bin/env bash
# รัน migrate_kbank.sql ด้วย postgres (peer auth บน Ubuntu EC2)
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
DB_USER="${DB_USER:-hotpot_user}"
SQL_FILE="$BACKEND_ROOT/scripts/migrate_kbank.sql"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "❌ ไม่พบ $SQL_FILE"
  exit 1
fi

echo "🔄 KBank SQL migration"
echo "   database: $DB_NAME"
echo "   app_user (GRANT): $DB_USER"
echo ""

if command -v sudo >/dev/null 2>&1 && id postgres >/dev/null 2>&1; then
  exec sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -v app_user="$DB_USER" -f "$SQL_FILE"
else
  echo "❌ ไม่พบ sudo หรือ user postgres — ใช้คำสั่ง psql เอง (RDS/master user):"
  echo "   psql \"...connection...\" -v ON_ERROR_STOP=1 -v app_user=$DB_USER -f scripts/migrate_kbank.sql"
  exit 1
fi
