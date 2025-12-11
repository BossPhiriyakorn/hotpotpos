-- ============================================
-- SQL Script สำหรับตรวจสอบ Branch Filtering
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
    b.id as branch_table_id,
    b.name as branch_name,
    b.code as branch_code,
    b.is_active as branch_is_active,
    u.is_active as user_is_active,
    CASE 
        WHEN u.user_type = 'admin' THEN 'Admin (ใช้ CMS)'
        WHEN u.branch_id IS NULL THEN '⚠️ ไม่มีสาขา (ต้องกำหนดสาขา)'
        WHEN b.id IS NULL THEN '⚠️ branch_id ไม่มีใน branches table'
        WHEN b.is_active = false THEN '⚠️ สาขาถูก soft delete'
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
    b.id as branch_table_id,
    b.name as branch_name,
    b.code as branch_code,
    b.is_active as branch_is_active,
    o.order_status,
    o.created_at,
    CASE 
        WHEN o.branch_id IS NULL THEN '⚠️ ไม่มีสาขา'
        WHEN b.id IS NULL THEN '⚠️ branch_id ไม่มีใน branches table'
        WHEN b.is_active = false THEN '⚠️ สาขาถูก soft delete'
        ELSE '✅ มีสาขา'
    END as status
FROM orders o
LEFT JOIN branches b ON o.branch_id = b.id
WHERE o.created_at >= CURRENT_DATE
    AND o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
ORDER BY o.created_at DESC;

-- ============================================
-- 3. สรุปจำนวน Orders แยกตามสาขา (วันนี้)
-- ============================================
SELECT 
    COALESCE(b.name, 'ไม่ระบุสาขา') as branch_name,
    b.id as branch_id,
    b.is_active as branch_is_active,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN o.order_status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END) as active_orders
FROM orders o
LEFT JOIN branches b ON o.branch_id = b.id
WHERE o.created_at >= CURRENT_DATE
    AND o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
GROUP BY b.id, b.name, b.is_active
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
-- 5. ตรวจสอบ Orders ที่ไม่มี branch_id หรือ branch_id ไม่มีใน branches (วันนี้)
-- ============================================
SELECT 
    o.id,
    o.order_number,
    o.queue_number,
    o.branch_id,
    o.created_at
FROM orders o
WHERE o.created_at >= CURRENT_DATE
    AND o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
    AND (
        o.branch_id IS NULL
        OR NOT EXISTS (
            SELECT 1 FROM branches b 
            WHERE b.id = o.branch_id AND b.is_active = true
        )
    );

-- ============================================
-- 6. ตรวจสอบ Branches ทั้งหมด
-- ============================================
SELECT 
    id,
    name,
    code,
    is_active,
    created_at
FROM branches
ORDER BY id;

