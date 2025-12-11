-- ============================================
-- SQL Script สำหรับอัพเดทออเดอร์เก่าที่ไม่มี branch_id
-- ให้ชี้ไปที่สาขาหลัก (MAIN)
-- ============================================

-- อัพเดทออเดอร์ที่ branch_id เป็น NULL ให้ชี้ไปที่สาขาหลัก
UPDATE orders 
SET branch_id = (SELECT id FROM branches WHERE code = 'MAIN' AND is_active = true LIMIT 1)
WHERE branch_id IS NULL;

-- ตรวจสอบผลลัพธ์
SELECT 
    'Updated orders' as action,
    COUNT(*) as total_orders_with_branch
FROM orders 
WHERE branch_id IS NOT NULL;

SELECT 
    'Orders without branch' as status,
    COUNT(*) as count
FROM orders 
WHERE branch_id IS NULL;

