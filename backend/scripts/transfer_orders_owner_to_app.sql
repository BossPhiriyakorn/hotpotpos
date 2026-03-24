-- =============================================================================
-- Optional — รันครั้งเดียวเป็น postgres ถ้าต้องการให้แอป user เป็น owner ของ orders
-- หลังนี้ npm run db:migrate:kbank (Node) อาจ ALTER TABLE orders ได้โดยไม่ต้อง sudo
-- =============================================================================
--   sudo -u postgres psql -d hotpot_kiosk_db -v ON_ERROR_STOP=1 -v app_user=hotpot_user -f scripts/transfer_orders_owner_to_app.sql
-- (แก้ชื่อ DB / app_user ให้ตรง backend/.env)
-- =============================================================================

ALTER TABLE orders OWNER TO :"app_user";
