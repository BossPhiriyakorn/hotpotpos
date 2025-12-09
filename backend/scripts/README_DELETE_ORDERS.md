# 🗑️ คู่มือการลบข้อมูลออเดอร์

## 📋 ข้อมูลออเดอร์มาจากไหน?

ข้อมูลออเดอร์ที่เห็นในรายงานมาจาก:
1. **การทดสอบระบบ** - เมื่อทดสอบการสร้างออเดอร์ผ่าน Kiosk (SummaryScreen)
2. **API Testing** - การทดสอบ API endpoint `/api/orders` โดยตรง
3. **การใช้งานจริง** - เมื่อมีลูกค้าสั่งซื้อผ่าน Kiosk

---

## 🔍 วิธีตรวจสอบข้อมูลออเดอร์

### วิธีที่ 1: ใช้ pgAdmin

1. เปิด pgAdmin
2. ไปที่ Database: `hotpot_kiosk_db`
3. คลิกขวาที่ Database → **Query Tool**
4. เปิดไฟล์ `backend/scripts/checkOrders.sql`
5. คัดลอกและวางคำสั่ง SQL
6. กด **Execute** (F5)

### วิธีที่ 2: ใช้ Terminal/Command Line

```bash
# เข้าไปที่ backend directory
cd backend

# ใช้ psql (ต้องมี PostgreSQL client)
psql -h localhost -U hotpot_user -d hotpot_kiosk_db -f scripts/checkOrders.sql
```

---

## 🗑️ วิธีลบข้อมูลออเดอร์

### ⚠️ คำเตือน
- **การลบข้อมูลไม่สามารถกู้คืนได้!**
- ควร Backup ข้อมูลก่อนลบ (ถ้าต้องการเก็บไว้)
- ตรวจสอบข้อมูลก่อนลบเสมอ

### วิธีที่ 1: ลบทั้งหมด (ใช้เมื่อแน่ใจ)

1. เปิด pgAdmin
2. ไปที่ Database: `hotpot_kiosk_db`
3. คลิกขวาที่ Database → **Query Tool**
4. เปิดไฟล์ `backend/scripts/deleteAllOrders.sql`
5. **อ่านคำเตือนให้ดี**
6. คัดลอกและวางคำสั่ง SQL
7. กด **Execute** (F5)

### วิธีที่ 2: ลบตามวันที่ (แนะนำ)

1. เปิด pgAdmin
2. ไปที่ Database: `hotpot_kiosk_db`
3. คลิกขวาที่ Database → **Query Tool**
4. เปิดไฟล์ `backend/scripts/deleteOrdersByDate.sql`
5. แก้ไขวันที่ใน SQL:
   ```sql
   WHERE DATE(created_at) = '2025-12-07'  -- แก้ไขวันที่ตามต้องการ
   ```
6. คัดลอกและวางคำสั่ง SQL
7. กด **Execute** (F5)

### วิธีที่ 3: ลบผ่าน SQL โดยตรง

```sql
-- ลบออเดอร์ทั้งหมด (ระวัง!)
BEGIN;

DELETE FROM kitchen_order_status;
DELETE FROM order_addons;
DELETE FROM orders;

COMMIT;
```

---

## 📊 ตรวจสอบผลลัพธ์หลังลบ

รันคำสั่งนี้เพื่อตรวจสอบ:

```sql
SELECT 
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_addons) as order_addons_count,
    (SELECT COUNT(*) FROM kitchen_order_status) as kitchen_status_count;
```

ถ้าลบสำเร็จ ควรได้:
- `orders_count`: 0
- `order_addons_count`: 0
- `kitchen_status_count`: 0

---

## 🔄 รีเซ็ต Sequence (ถ้าต้องการ)

ถ้าต้องการให้ `order_number` เริ่มใหม่จาก 00001:

```sql
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
```

---

## 💡 คำแนะนำ

1. **ก่อนลบ**: ตรวจสอบข้อมูลด้วย `checkOrders.sql` ก่อน
2. **Backup**: ถ้าต้องการเก็บข้อมูลไว้ ควร Export เป็น CSV หรือ SQL dump
3. **ลบตามวันที่**: แนะนำให้ลบตามวันที่แทนการลบทั้งหมด
4. **หลังลบ**: ตรวจสอบผลลัพธ์เสมอ

---

## 📝 ตัวอย่างการ Export ข้อมูลก่อนลบ

```sql
-- Export orders เป็น CSV (ใน pgAdmin)
-- คลิกขวาที่ตาราง orders → Import/Export Data → Export
```

หรือใช้ SQL:

```sql
COPY (
    SELECT * FROM orders 
    WHERE DATE(created_at) = '2025-12-07'
) TO 'C:/path/to/backup.csv' WITH CSV HEADER;
```

