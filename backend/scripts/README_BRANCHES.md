# 📋 คู่มือการสร้างระบบสาขา (Branch System)

## 🎯 วัตถุประสงค์

สร้างระบบสาขาเพื่อให้สามารถ:
- จัดการหลายสาขาได้
- User แต่ละคนเชื่อมโยงกับสาขา
- Order แต่ละออเดอร์บันทึกสาขาที่ขาย
- Reports สามารถกรองตามสาขาได้
- Admin สามารถดูทุกสาขาได้
- User ธรรมดาเห็นแค่สาขาของตัวเอง

---

## 🚀 ขั้นตอนการติดตั้ง

### 1. เปิด pgAdmin
- เปิด pgAdmin และเชื่อมต่อกับ database `hotpot_kiosk_db`

### 2. เปิด Query Tool
- คลิกขวาที่ database → **Query Tool**

### 3. รัน SQL Script
- เปิดไฟล์ `backend/scripts/createBranchesTable.sql`
- Copy ทั้งหมดและวางใน Query Tool
- กด **F5** หรือคลิก **Execute** เพื่อรัน

### 4. ตรวจสอบผลลัพธ์
- ดูผลลัพธ์ในแท็บ **Messages** และ **Data Output**
- Script จะแสดง:
  - จำนวนสาขาทั้งหมด
  - จำนวน users ที่มี branch_id
  - จำนวน orders ที่มี branch_id

---

## ✅ สิ่งที่ Script จะทำ

### 1. สร้างตาราง `branches`
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255) NOT NULL UNIQUE) - ชื่อสาขา
- `code` (VARCHAR(50) UNIQUE) - รหัสสาขา (เช่น MAIN, B001)
- `address` (TEXT) - ที่อยู่สาขา
- `phone` (VARCHAR(50)) - เบอร์โทรสาขา
- `is_active` (BOOLEAN DEFAULT true) - สถานะการใช้งาน
- `created_at`, `updated_at` (TIMESTAMP)

### 2. เพิ่ม `branch_id` ในตาราง `users`
- Foreign Key ไปยัง `branches(id)`
- ON DELETE SET NULL (ถ้าลบสาขา user จะเป็น NULL)

### 3. เพิ่ม `branch_id` ในตาราง `orders`
- Foreign Key ไปยัง `branches(id)`
- ON DELETE SET NULL (ถ้าลบสาขา order จะเป็น NULL)

### 4. สร้าง Indexes
- `idx_users_branch_id` - สำหรับค้นหา users ตามสาขา
- `idx_orders_branch_id` - สำหรับค้นหา orders ตามสาขา
- `idx_branches_is_active` - สำหรับกรองสาขาที่ active

### 5. สร้างสาขาเริ่มต้น
- สร้างสาขา "สาขาหลัก" (code: MAIN) อัตโนมัติ

### 6. อัพเดท Users ที่มีอยู่แล้ว
- Users ที่ยังไม่มี `branch_id` จะถูกอัพเดทให้ชี้ไปที่สาขาหลัก

### 7. Grant Permissions
- ให้สิทธิ์ `hotpot_user` ในการจัดการตาราง `branches`

---

## 📊 ตรวจสอบผลลัพธ์

หลังจากรัน script แล้ว ตรวจสอบด้วยคำสั่ง SQL:

```sql
-- ดูสาขาทั้งหมด
SELECT * FROM branches;

-- ดู users พร้อมสาขา
SELECT u.id, u.username, u.user_type, b.name as branch_name
FROM users u
LEFT JOIN branches b ON u.branch_id = b.id;

-- ดู orders พร้อมสาขา
SELECT o.id, o.order_number, b.name as branch_name
FROM orders o
LEFT JOIN branches b ON o.branch_id = b.id
ORDER BY o.created_at DESC
LIMIT 10;
```

---

## ⚠️ หมายเหตุ

1. **ข้อมูลเดิม**: Orders ที่สร้างก่อนรัน script จะมี `branch_id = NULL`
   - สามารถอัพเดทด้วย SQL:
   ```sql
   UPDATE orders 
   SET branch_id = (SELECT id FROM branches WHERE code = 'MAIN' LIMIT 1)
   WHERE branch_id IS NULL;
   ```

2. **Users เดิม**: Users ที่มีอยู่แล้วจะถูกอัพเดทให้ชี้ไปที่สาขาหลักอัตโนมัติ

3. **การลบสาขา**: 
   - ถ้าสาขามี orders หรือ users อยู่ จะทำ Soft Delete (is_active = false)
   - ถ้าไม่มี จะทำ Hard Delete (ลบออกจาก database)

---

## 🔄 หลังรัน Script

1. **Restart Backend Server**
   ```bash
   pm2 restart hotpot-backend
   ```

2. **ทดสอบ API**
   ```bash
   # Get all branches
   curl http://localhost:3001/api/branches
   
   # Get branch by ID
   curl http://localhost:3001/api/branches/1
   ```

3. **ทดสอบใน Frontend**
   - เปิดหน้า CMS
   - ไปที่ Branch Management (ถ้ามี)
   - สร้างสาขาใหม่
   - ทดสอบ Reports พร้อม branch filter

---

## 📝 สรุป

✅ ตาราง `branches` ถูกสร้างแล้ว  
✅ `branch_id` ถูกเพิ่มใน `users` และ `orders` แล้ว  
✅ Indexes ถูกสร้างแล้ว  
✅ สาขาหลักถูกสร้างแล้ว  
✅ Users เดิมถูกอัพเดทแล้ว  
✅ Permissions ถูกตั้งค่าแล้ว  

ระบบสาขาพร้อมใช้งานแล้ว! 🎉

