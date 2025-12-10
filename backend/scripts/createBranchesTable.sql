-- ============================================
-- SQL Script สำหรับสร้างระบบสาขา (Branch System)
-- รันใน pgAdmin Query Tool เพื่อสร้างตารางและเพิ่มคอลัมน์
-- ============================================

-- ============================================
-- 1. สร้างตาราง branches
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE, -- รหัสสาขา (เช่น B001, B002)
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. เพิ่ม branch_id ในตาราง users (ถ้ายังไม่มี)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE users ADD COLUMN branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added branch_id column to users table';
    ELSE
        RAISE NOTICE 'Column branch_id already exists in users table';
    END IF;
END $$;

-- ============================================
-- 3. เพิ่ม branch_id ในตาราง orders (ถ้ายังไม่มี)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added branch_id column to orders table';
    ELSE
        RAISE NOTICE 'Column branch_id already exists in orders table';
    END IF;
END $$;

-- ============================================
-- 4. สร้าง Indexes สำหรับประสิทธิภาพ
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);

-- ============================================
-- 5. สร้างสาขาเริ่มต้น (Default Branch)
-- ============================================
INSERT INTO branches (name, code, is_active)
VALUES ('สาขาหลัก', 'MAIN', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 6. อัพเดท users ที่มีอยู่แล้วให้ชี้ไปที่สาขาหลัก (ถ้ายังไม่มี branch_id)
-- ============================================
UPDATE users 
SET branch_id = (SELECT id FROM branches WHERE code = 'MAIN' LIMIT 1)
WHERE branch_id IS NULL;

-- ============================================
-- 7. Grant Permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON branches TO hotpot_user;
GRANT USAGE, SELECT ON SEQUENCE branches_id_seq TO hotpot_user;

-- ============================================
-- 8. ตรวจสอบผลลัพธ์
-- ============================================
SELECT 
    'branches' as table_name,
    COUNT(*) as total_branches,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_branches
FROM branches;

SELECT 
    'users' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN branch_id IS NOT NULL THEN 1 END) as users_with_branch
FROM users;

SELECT 
    'orders' as table_name,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN branch_id IS NOT NULL THEN 1 END) as orders_with_branch
FROM orders;

