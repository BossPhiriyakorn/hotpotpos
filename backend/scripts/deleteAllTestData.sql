-- ============================================
-- ลบข้อมูลทดสอบทั้งหมด (ครัว, หน้าแสดงรายการ, รายการออเดอร์ CMS)
-- ⚠️ คำเตือน: คำสั่งนี้จะลบข้อมูลทั้งหมด ไม่สามารถกู้คืนได้!
-- ============================================

BEGIN;

-- แสดงจำนวนข้อมูลก่อนลบ
SELECT 
    'ก่อนลบ' as status,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_addons) as order_addons_count,
    (SELECT COUNT(*) FROM kitchen_order_status) as kitchen_status_count,
    (SELECT COUNT(*) FROM line_notifications) as line_notifications_count;

-- 1. ลบข้อมูลในตารางที่เกี่ยวข้องก่อน (ตาม Foreign Key)
-- ลบ kitchen_order_status (สถานะครัว)
DELETE FROM kitchen_order_status;

-- ลบ line_notifications (การแจ้งเตือน LINE)
DELETE FROM line_notifications;

-- ลบ order_addons (addons ที่สั่ง)
DELETE FROM order_addons;

-- ลบ orders (ออเดอร์หลัก)
DELETE FROM orders;

-- แสดงจำนวนข้อมูลหลังลบ
SELECT 
    'หลังลบ' as status,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_addons) as order_addons_count,
    (SELECT COUNT(*) FROM kitchen_order_status) as kitchen_status_count,
    (SELECT COUNT(*) FROM line_notifications) as line_notifications_count;

COMMIT;

-- ============================================
-- หมายเหตุ:
-- 1. Script นี้จะลบข้อมูลทั้งหมดในตารางที่เกี่ยวข้องกับออเดอร์
-- 2. ข้อมูลที่ถูกลบ:
--    - orders (ออเดอร์ทั้งหมด)
--    - order_addons (addons ที่สั่ง)
--    - kitchen_order_status (สถานะครัว)
--    - line_notifications (การแจ้งเตือน LINE)
-- 3. ข้อมูลที่ยังคงอยู่:
--    - users (ผู้ใช้)
--    - soups (ซุป)
--    - addons (addons)
--    - spice_levels (ระดับความเผ็ด)
--    - settings (การตั้งค่า)
--    - activity_logs (บันทึกกิจกรรม)
-- ============================================

