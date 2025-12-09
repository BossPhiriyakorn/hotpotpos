-- ============================================
-- ลบข้อมูลออเดอร์ตามวันที่
-- ใช้สำหรับลบออเดอร์ในช่วงเวลาที่กำหนด
-- ============================================

-- ตัวอย่าง: ลบออเดอร์ทั้งหมดในวันที่ 2025-12-07
-- แก้ไขวันที่ตามต้องการ

BEGIN;

-- 1. ลบ kitchen_order_status ที่เกี่ยวข้อง
DELETE FROM kitchen_order_status
WHERE order_id IN (
    SELECT id FROM orders 
    WHERE DATE(created_at) = '2025-12-07'
);

-- 2. ลบ order_addons ที่เกี่ยวข้อง
DELETE FROM order_addons
WHERE order_id IN (
    SELECT id FROM orders 
    WHERE DATE(created_at) = '2025-12-07'
);

-- 3. ลบ orders
DELETE FROM orders
WHERE DATE(created_at) = '2025-12-07';

-- 4. ตรวจสอบผลลัพธ์
SELECT 
    COUNT(*) as remaining_orders
FROM orders
WHERE DATE(created_at) = '2025-12-07';

COMMIT;

-- ============================================
-- ตัวอย่าง: ลบออเดอร์ในช่วงวันที่
-- ============================================
/*
BEGIN;

DELETE FROM kitchen_order_status
WHERE order_id IN (
    SELECT id FROM orders 
    WHERE DATE(created_at) >= '2025-12-01' 
    AND DATE(created_at) <= '2025-12-07'
);

DELETE FROM order_addons
WHERE order_id IN (
    SELECT id FROM orders 
    WHERE DATE(created_at) >= '2025-12-01' 
    AND DATE(created_at) <= '2025-12-07'
);

DELETE FROM orders
WHERE DATE(created_at) >= '2025-12-01' 
AND DATE(created_at) <= '2025-12-07';

COMMIT;
*/

