-- =============================================================================
-- KBank migration — รันด้วย superuser / เจ้าของตาราง orders (แก้ปัญหา must be owner)
-- =============================================================================
-- ต้องส่งตัวแปร psql: app_user = ชื่อผู้ใช้แอป (เดียวกับ DB_USER ใน backend/.env)
--
-- EC2 + PostgreSQL บนเครื่องเดียวกัน (แนะนำ):
--   cd ~/hotpot/backend
--   sudo -u postgres psql -d hotpot_kiosk_db -v ON_ERROR_STOP=1 -v app_user=hotpot_user -f scripts/migrate_kbank.sql
--
-- หรือใช้สคริปต์ (อ่าน DB_NAME / DB_USER จาก .env):
--   bash scripts/kbank-migrate.sh
--
-- RDS / remote: ใช้ user master แทน postgres
--   psql "postgresql://USER:PASS@HOST:5432/DBNAME?sslmode=require" \
--     -v ON_ERROR_STOP=1 -v app_user=hotpot_user -f scripts/migrate_kbank.sql
-- =============================================================================

BEGIN;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS kbank_charge_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kbank_payment_id VARCHAR(100);

CREATE TABLE IF NOT EXISTS kbank_charges (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  charge_id VARCHAR(100) UNIQUE NOT NULL,
  partner_tx_id VARCHAR(100) UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'THB',
  status VARCHAR(50) DEFAULT 'pending',
  qr_code_data TEXT,
  qr_image_url TEXT,
  payment_method VARCHAR(50),
  kbank_payment_id VARCHAR(100),
  paid_at TIMESTAMP,
  expires_at TIMESTAMP,
  raw_request JSONB,
  raw_response JSONB,
  raw_webhook JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT, INSERT, UPDATE ON kbank_charges TO :"app_user";
GRANT USAGE, SELECT ON SEQUENCE kbank_charges_id_seq TO :"app_user";

INSERT INTO settings (key, value, description, category, data_type)
VALUES (
  'payment_mode',
  'static_qr',
  'โหมดการชำระเงิน: static_qr = QR รูปนิ่ง (PromptPay), kbank_gateway = K Payment Gateway API',
  'payment',
  'text'
)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_kbank_charges_order_id ON kbank_charges(order_id);
CREATE INDEX IF NOT EXISTS idx_kbank_charges_charge_id ON kbank_charges(charge_id);
CREATE INDEX IF NOT EXISTS idx_kbank_charges_status ON kbank_charges(status);
CREATE INDEX IF NOT EXISTS idx_orders_kbank_charge_id ON orders(kbank_charge_id);

COMMIT;
