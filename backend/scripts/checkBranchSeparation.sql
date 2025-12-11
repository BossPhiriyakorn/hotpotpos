-- ============================================
-- SQL Script สำหรับตรวจสอบการแยกสาขา
-- ใช้ตรวจสอบว่า Users และ Orders มี branch_id ถูกต้องหรือไม่
-- ============================================

-- ============================================
-- 1. ตรวจสอบ Users พร้อม branch_id
-- ============================================
SELECT 
    u.id,
    u.username,
    u.user_type,
    u.branch_id,
    b.name as branch_name,
    b.code as branch_code,
    u.is_active,
    CASE 
        WHEN u.user_type = 'admin' THEN 'Admin (ใช้ CMS)'
        WHEN u.branch_id IS NULL THEN '⚠️ ไม่มีสาขา (ต้องกำหนดสาขา)'
        ELSE '✅ มีสาขา'
    END as status
FROM users u
LEFT JOIN branches b ON u.branch_id = b.id
WHERE u.is_active = true
ORDER BY u.user_type, u.branch_id, u.id;

-- ============================================
-- 2. ตรวจสอบ Orders วันนี้พร้อม branch_id
-- ============================================
SELECT 
    o.id,
    o.order_number,
    o.queue_number,
    o.branch_id,
    b.name as branch_name,
    b.code as branch_code,
    o.order_status,
    o.created_at,
    CASE 
        WHEN o.branch_id IS NULL THEN '⚠️ ไม่มีสาขา'
        ELSE '✅ มีสาขา'
    END as status
FROM orders o
LEFT JOIN branches b ON o.branch_id = b.id
WHERE o.created_at >= CURRENT_DATE
ORDER BY o.created_at DESC
LIMIT 20;

-- ============================================
-- 3. สรุปจำนวน Orders แยกตามสาขา (วันนี้)
-- ============================================
SELECT 
    COALESCE(b.name, 'ไม่ระบุสาขา') as branch_name,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN o.order_status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END) as active_orders
FROM orders o
LEFT JOIN branches b ON o.branch_id = b.id
WHERE o.created_at >= CURRENT_DATE
GROUP BY b.id, b.name
ORDER BY b.name;

-- ============================================
-- 4. ตรวจสอบ Users ที่ไม่มี branch_id (ต้องแก้ไข)
-- ============================================
SELECT 
    u.id,
    u.username,
    u.user_type,
    u.is_active
FROM users u
WHERE u.is_active = true
    AND u.user_type != 'admin'
    AND u.branch_id IS NULL;

-- ============================================
-- 5. ตรวจสอบ Orders ที่ไม่มี branch_id (วันนี้)
-- ============================================
SELECT 
    o.id,
    o.order_number,
    o.queue_number,
    o.created_at
FROM orders o
WHERE o.created_at >= CURRENT_DATE
    AND o.branch_id IS NULL;

