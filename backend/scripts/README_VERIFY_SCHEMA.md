# SQL Script สำหรับตรวจสอบและแก้ไข Database Schema

## 📋 ไฟล์
- `verifyAndFixSchema.sql` - Script สำหรับตรวจสอบและแก้ไข database schema อัตโนมัติ

## 🎯 วัตถุประสงค์
Script นี้ใช้สำหรับ:
1. ตรวจสอบว่าตารางและคอลัมน์ทั้งหมดมีอยู่ครบถ้วน
2. เพิ่มคอลัมน์ที่ขาดหายไปอัตโนมัติ
3. สร้าง Indexes ที่จำเป็นสำหรับประสิทธิภาพ
4. ตรวจสอบ Constraints และ Foreign Keys

## 🚀 วิธีใช้งาน

### 1. เปิด pgAdmin
- เปิด pgAdmin และเชื่อมต่อกับ database `hotpot_kiosk_db`

### 2. เปิด Query Tool
- คลิกขวาที่ database → **Query Tool**

### 3. รัน Script
- เปิดไฟล์ `verifyAndFixSchema.sql`
- Copy ทั้งหมดและวางใน Query Tool
- กด **F5** หรือคลิก **Execute** เพื่อรัน

### 4. ตรวจสอบผลลัพธ์
- ดูผลลัพธ์ในแท็บ **Messages** และ **Data Output**
- Script จะแสดงข้อความว่าเพิ่มคอลัมน์อะไรบ้าง หรือคอลัมน์มีอยู่แล้ว

## ✅ สิ่งที่ Script จะทำ

### 1. ตรวจสอบตารางทั้งหมด
- ตรวจสอบว่าตารางทั้งหมดมีอยู่หรือไม่

### 2. เพิ่มคอลัมน์ในตาราง `orders`
- `payment_method` (VARCHAR(50))
- `payment_reference` (TEXT)
- `paid_at` (TIMESTAMP WITH TIME ZONE)
- `confirmed_at` (TIMESTAMP WITH TIME ZONE)
- `completed_at` (TIMESTAMP WITH TIME ZONE)
- `cancelled_at` (TIMESTAMP WITH TIME ZONE)

### 3. เพิ่มคอลัมน์ในตาราง `activity_logs`
- `user_agent` (TEXT)
- `details` (TEXT)

### 4. เพิ่มคอลัมน์ในตาราง `kitchen_order_status`
- `note` (TEXT)

### 5. เพิ่มคอลัมน์ในตาราง `settings`
- `logo` (TEXT)
- `member_qr_code` (TEXT)

### 6. สร้าง Indexes
- `idx_orders_created_at` - สำหรับ reports
- `idx_orders_order_status` - สำหรับ filtering
- `idx_orders_payment_status` - สำหรับ filtering
- `idx_kitchen_order_status_order_id` - สำหรับ join
- `idx_kitchen_order_status_changed_at` - สำหรับ sorting
- `idx_order_addons_order_id` - สำหรับ join
- `idx_activity_logs_created_at` - สำหรับ reports

## ⚠️ หมายเหตุ

1. **ปลอดภัย**: Script ใช้ `IF NOT EXISTS` ดังนั้นรันได้หลายครั้งโดยไม่เกิดปัญหา
2. **ไม่ลบข้อมูล**: Script จะไม่ลบข้อมูลหรือคอลัมน์ที่มีอยู่แล้ว
3. **Backup**: แนะนำให้ backup database ก่อนรัน (ถ้าต้องการความปลอดภัยเพิ่มเติม)

## 🔍 ตรวจสอบผลลัพธ์

หลังจากรัน script แล้ว สามารถตรวจสอบได้ด้วย:

```sql
-- ตรวจสอบคอลัมน์ในตาราง orders
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- ตรวจสอบ Indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## 📝 ตัวอย่างผลลัพธ์

เมื่อรัน script สำเร็จ จะเห็นข้อความเช่น:
```
NOTICE: payment_method column already exists
NOTICE: Added payment_reference column to orders table
NOTICE: Added paid_at column to orders table
...
```

## 🆘 หากเกิดปัญหา

1. **Error: permission denied**
   - ตรวจสอบว่า user มีสิทธิ์ ALTER TABLE
   - รันคำสั่ง: `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hotpot_user;`

2. **Error: column already exists**
   - ไม่เป็นปัญหา Script จะข้ามคอลัมน์ที่มีอยู่แล้ว

3. **Error: relation does not exist**
   - ตรวจสอบว่าตารางถูกสร้างแล้วหรือยัง
   - ตรวจสอบชื่อ database ว่าถูกต้องหรือไม่

## 📞 ติดต่อ

หากมีปัญหาหรือคำถาม สามารถตรวจสอบ:
- Database schema ใน pgAdmin
- Logs ใน backend console
- Error messages ใน Query Tool

