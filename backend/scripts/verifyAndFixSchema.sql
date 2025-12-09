-- ============================================
-- SQL Script สำหรับตรวจสอบและแก้ไข Database Schema
-- รันใน pgAdmin Query Tool เพื่อตรวจสอบและแก้ไข schema
-- ============================================

-- ============================================
-- 1. ตรวจสอบว่าตารางทั้งหมดมีอยู่หรือไม่
-- ============================================
SELECT 
    table_name AS "ตาราง",
    CASE 
        WHEN table_name IN (
            'orders', 'order_addons', 'kitchen_order_status',
            'addons', 'soups', 'spice_levels',
            'line_notifications', 'users', 'activity_logs', 'settings',
            'members', 'member_orders'
        ) THEN '✓ มีอยู่'
        ELSE '⚠ ไม่พบ'
    END AS "สถานะ"
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. ตรวจสอบคอลัมน์ที่สำคัญในตาราง orders
-- ============================================
SELECT 
    column_name AS "คอลัมน์",
    data_type AS "ประเภท",
    is_nullable AS "Nullable",
    column_default AS "ค่าเริ่มต้น"
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name IN (
        'payment_method', 'payment_reference',
        'paid_at', 'confirmed_at', 'completed_at', 'cancelled_at'
    )
ORDER BY ordinal_position;

-- ============================================
-- 3. เพิ่มคอลัมน์ที่ขาดหายไปในตาราง orders (ถ้ายังไม่มี)
-- ============================================
-- ตรวจสอบและเพิ่ม payment_method ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
        RAISE NOTICE 'Added payment_method column to orders table';
    ELSE
        RAISE NOTICE 'payment_method column already exists';
    END IF;
END $$;

-- ตรวจสอบและเพิ่ม payment_reference ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_reference TEXT;
        RAISE NOTICE 'Added payment_reference column to orders table';
    ELSE
        RAISE NOTICE 'payment_reference column already exists';
    END IF;
END $$;

-- ตรวจสอบและเพิ่ม paid_at ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added paid_at column to orders table';
    ELSE
        RAISE NOTICE 'paid_at column already exists';
    END IF;
END $$;

-- ตรวจสอบและเพิ่ม confirmed_at ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'confirmed_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added confirmed_at column to orders table';
    ELSE
        RAISE NOTICE 'confirmed_at column already exists';
    END IF;
END $$;

-- ตรวจสอบและเพิ่ม completed_at ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added completed_at column to orders table';
    ELSE
        RAISE NOTICE 'completed_at column already exists';
    END IF;
END $$;

-- ตรวจสอบและเพิ่ม cancelled_at ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added cancelled_at column to orders table';
    ELSE
        RAISE NOTICE 'cancelled_at column already exists';
    END IF;
END $$;

-- ============================================
-- 4. ตรวจสอบคอลัมน์ในตาราง activity_logs
-- ============================================
-- ตรวจสอบและเพิ่ม user_agent ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE activity_logs ADD COLUMN user_agent TEXT;
        RAISE NOTICE 'Added user_agent column to activity_logs table';
    ELSE
        RAISE NOTICE 'user_agent column already exists';
    END IF;
END $$;

-- ตรวจสอบและเพิ่ม details ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs' 
        AND column_name = 'details'
    ) THEN
        ALTER TABLE activity_logs ADD COLUMN details TEXT;
        RAISE NOTICE 'Added details column to activity_logs table';
    ELSE
        RAISE NOTICE 'details column already exists';
    END IF;
END $$;

-- ============================================
-- 5. ตรวจสอบคอลัมน์ในตาราง kitchen_order_status
-- ============================================
-- ตรวจสอบและเพิ่ม note ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kitchen_order_status' 
        AND column_name = 'note'
    ) THEN
        ALTER TABLE kitchen_order_status ADD COLUMN note TEXT;
        RAISE NOTICE 'Added note column to kitchen_order_status table';
    ELSE
        RAISE NOTICE 'note column already exists';
    END IF;
END $$;

-- ============================================
-- 6. ตรวจสอบคอลัมน์ในตาราง settings
-- ============================================
-- ตรวจสอบและเพิ่ม logo ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'logo'
    ) THEN
        ALTER TABLE settings ADD COLUMN logo TEXT;
        RAISE NOTICE 'Added logo column to settings table';
    ELSE
        RAISE NOTICE 'logo column already exists';
    END IF;
END $$;

-- ตรวจสอบและเพิ่ม member_qr_code ถ้ายังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'member_qr_code'
    ) THEN
        ALTER TABLE settings ADD COLUMN member_qr_code TEXT;
        RAISE NOTICE 'Added member_qr_code column to settings table';
    ELSE
        RAISE NOTICE 'member_qr_code column already exists';
    END IF;
END $$;

-- ============================================
-- 7. ตรวจสอบ Indexes ที่สำคัญ
-- ============================================
SELECT 
    tablename AS "ตาราง",
    indexname AS "Index",
    indexdef AS "คำสั่ง"
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        indexname LIKE '%order_id%' OR
        indexname LIKE '%created_at%' OR
        indexname LIKE '%status%' OR
        indexname LIKE '%queue_number%'
    )
ORDER BY tablename, indexname;

-- ============================================
-- 8. สร้าง Indexes ที่อาจขาดหายไป (ถ้ายังไม่มี)
-- ============================================
-- Index สำหรับ orders.created_at (สำหรับ reports)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Index สำหรับ orders.order_status (สำหรับ filtering)
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);

-- Index สำหรับ orders.payment_status (สำหรับ filtering)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Index สำหรับ kitchen_order_status.order_id และ changed_at
CREATE INDEX IF NOT EXISTS idx_kitchen_order_status_order_id ON kitchen_order_status(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_order_status_changed_at ON kitchen_order_status(changed_at DESC);

-- Index สำหรับ order_addons.order_id
CREATE INDEX IF NOT EXISTS idx_order_addons_order_id ON order_addons(order_id);

-- Index สำหรับ activity_logs.created_at
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- 9. ตรวจสอบ Constraints และ Foreign Keys
-- ============================================
SELECT
    tc.table_name AS "ตาราง",
    tc.constraint_name AS "Constraint",
    tc.constraint_type AS "ประเภท",
    kcu.column_name AS "คอลัมน์",
    ccu.table_name AS "ตารางอ้างอิง",
    ccu.column_name AS "คอลัมน์อ้างอิง"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- 10. สรุปผลการตรวจสอบ
-- ============================================
SELECT 
    'Schema Verification Complete' AS "สถานะ",
    COUNT(DISTINCT table_name) AS "จำนวนตาราง",
    COUNT(DISTINCT column_name) AS "จำนวนคอลัมน์",
    COUNT(DISTINCT indexname) AS "จำนวน Indexes"
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN pg_indexes i ON t.table_name = i.tablename
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE';

-- ============================================
-- 11. ตรวจสอบ Sequences
-- ============================================
SELECT 
    sequence_name AS "Sequence",
    last_value AS "ค่าล่าสุด"
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================
-- สิ้นสุด Script
-- ============================================
-- หมายเหตุ: Script นี้จะตรวจสอบและเพิ่มคอลัมน์ที่ขาดหายไปโดยอัตโนมัติ
-- ถ้าคอลัมน์มีอยู่แล้วจะไม่ทำอะไร (ใช้ IF NOT EXISTS)
-- รัน Script นี้ได้หลายครั้งโดยไม่เกิดปัญหา

