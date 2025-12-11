-- ============================================
-- SQL Script สำหรับแก้ไข UNIQUE Constraints
-- ให้รองรับ Soft Delete (is_active = false)
-- ============================================

-- ============================================
-- 1. แก้ไข branches table
-- ============================================

-- ลบ UNIQUE constraint เดิม
ALTER TABLE branches 
DROP CONSTRAINT IF EXISTS branches_name_key;

ALTER TABLE branches 
DROP CONSTRAINT IF EXISTS branches_code_key;

-- สร้าง Partial Unique Index (เฉพาะ active branches)
-- ชื่อซ้ำได้ถ้า branch เดิมถูก soft delete แล้ว
CREATE UNIQUE INDEX IF NOT EXISTS branches_name_unique_active 
ON branches(name) 
WHERE is_active = true;

-- Code ซ้ำได้ถ้า branch เดิมถูก soft delete แล้ว
-- และ code ไม่เป็น NULL
CREATE UNIQUE INDEX IF NOT EXISTS branches_code_unique_active 
ON branches(code) 
WHERE code IS NOT NULL AND is_active = true;

-- ============================================
-- 2. แก้ไข users table (ถ้ามี UNIQUE constraint)
-- ============================================

-- ตรวจสอบว่ามี UNIQUE constraint บน username หรือไม่
DO $$
BEGIN
    -- ลบ UNIQUE constraint ถ้ามี
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_username_key;
        RAISE NOTICE 'Dropped users_username_key constraint';
    END IF;
END $$;

-- สร้าง Partial Unique Index (เฉพาะ active users)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_active 
ON users(username) 
WHERE is_active = true;

-- ============================================
-- 3. ตรวจสอบผลลัพธ์
-- ============================================

-- ตรวจสอบ indexes ที่สร้าง
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('branches', 'users')
    AND indexname LIKE '%_unique_active'
ORDER BY tablename, indexname;

-- ตรวจสอบ constraints ที่เหลือ
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid IN (
    'branches'::regclass,
    'users'::regclass
)
ORDER BY conrelid::regclass::text, conname;

