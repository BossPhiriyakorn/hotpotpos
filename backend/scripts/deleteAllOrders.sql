-- ============================================
-- ลบข้อมูลออเดอร์ทั้งหมดออกจากฐานข้อมูล
-- ⚠️ คำเตือน: คำสั่งนี้จะลบข้อมูลทั้งหมด ไม่สามารถกู้คืนได้!
-- ============================================

-- 1. ลบข้อมูลในตารางที่เกี่ยวข้องก่อน (ตาม Foreign Key)
DELETE FROM kitchen_order_status;
DELETE FROM order_addons;
DELETE FROM orders;

-- 2. รีเซ็ต sequence (ถ้าต้องการให้ order_number เริ่มใหม่)
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;

-- 3. ตรวจสอบว่าลบหมดแล้ว
SELECT 
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_addons) as order_addons_count,
    (SELECT COUNT(*) FROM kitchen_order_status) as kitchen_status_count;

