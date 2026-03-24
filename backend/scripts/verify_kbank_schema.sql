-- =============================================================================
-- เช็กว่า migration KBank สำเร็จ (รันด้วย postgres หรือ user ที่อ่าน information_schema ได้)
-- =============================================================================
-- ตัวอย่าง:
--   sudo -u postgres psql -d hotpot_kiosk_db -v ON_ERROR_STOP=1 -f scripts/verify_kbank_schema.sql
-- =============================================================================

\echo '--- orders: คอลัมน์ kbank_* ---'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN ('kbank_charge_id', 'kbank_payment_id')
ORDER BY column_name;

\echo ''
\echo '--- ตาราง kbank_charges ---'
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'kbank_charges'
) AS kbank_charges_exists;

\echo ''
\echo '--- คอลัมน์ใน kbank_charges (ย่อ) ---'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'kbank_charges'
ORDER BY ordinal_position;

\echo ''
\echo '--- settings: payment_mode ---'
SELECT key, value, category
FROM settings
WHERE key = 'payment_mode';

\echo ''
\echo '--- index ที่เกี่ยวข้อง ---'
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_kbank_%'
    OR indexname = 'idx_orders_kbank_charge_id'
  )
ORDER BY indexname;
