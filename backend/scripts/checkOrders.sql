-- ============================================
-- ตรวจสอบข้อมูลออเดอร์ในฐานข้อมูล
-- ============================================

-- 1. ดูจำนวนออเดอร์ทั้งหมด
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN order_status != 'cancelled' THEN 1 END) as active_orders,
    COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders
FROM orders;

-- 2. ดูรายละเอียดออเดอร์ทั้งหมด (ล่าสุด 10 รายการ)
SELECT 
    o.id,
    o.order_number,
    o.queue_number,
    o.total_price,
    o.order_status,
    o.payment_status,
    o.dining_location,
    o.created_at,
    s.name as soup_name,
    COUNT(DISTINCT oa.id) as addon_count
FROM orders o
LEFT JOIN soups s ON o.soup_id = s.id
LEFT JOIN order_addons oa ON o.id = oa.order_id
GROUP BY o.id, o.order_number, o.queue_number, o.total_price, o.order_status, o.payment_status, o.dining_location, o.created_at, s.name
ORDER BY o.created_at DESC
LIMIT 10;

-- 3. ดูยอดขายรวม
SELECT 
    DATE(created_at) as date,
    COUNT(*) as order_count,
    SUM(total_price) as total_revenue
FROM orders
WHERE order_status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 4. ดูออเดอร์พร้อมรายละเอียด addons
SELECT 
    o.id,
    o.order_number,
    o.created_at,
    o.total_price,
    a.name as addon_name,
    oa.quantity,
    oa.total_price as addon_total
FROM orders o
LEFT JOIN order_addons oa ON o.id = oa.order_id
LEFT JOIN addons a ON oa.addon_id = a.id
ORDER BY o.created_at DESC
LIMIT 20;

