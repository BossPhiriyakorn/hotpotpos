# Scripts สำหรับจัดการ Database

## 📋 ไฟล์ที่มี

### Users
- `createUsers.js` - Script สำหรับสร้าง users ใน database

### Orders (ตรวจสอบและลบ)
- `checkOrders.sql` - ตรวจสอบข้อมูลออเดอร์ในฐานข้อมูล
- `deleteAllOrders.sql` - ลบข้อมูลออเดอร์ทั้งหมด (⚠️ ระวัง!)
- `deleteOrdersByDate.sql` - ลบข้อมูลออเดอร์ตามวันที่
- `README_DELETE_ORDERS.md` - คู่มือการลบข้อมูลออเดอร์อย่างละเอียด

## KBank — ถ้า `npm run db:migrate:kbank` ขึ้น `must be owner of table orders`

PostgreSQL ให้เฉพาะ **owner / superuser** แก้ `orders` ได้ — user แอป (`DB_USER`) มักไม่ใช่ owner

**แนะนำบน EC2 (Postgres บนเครื่องเดียวกัน):**

```bash
cd ~/hotpot/backend
chmod +x scripts/kbank-migrate.sh scripts/kbank-verify.sh   # ครั้งแรก (ถ้าต้องการ)
bash scripts/kbank-migrate.sh
bash scripts/kbank-verify.sh
```

หรือรัน `psql` ตรงๆ (แก้ชื่อ DB และ user ให้ตรง `.env`):

```bash
sudo -u postgres psql -d hotpot_kiosk_db -v ON_ERROR_STOP=1 -v app_user=hotpot_user -f scripts/migrate_kbank.sql
sudo -u postgres psql -d hotpot_kiosk_db -v ON_ERROR_STOP=1 -f scripts/verify_kbank_schema.sql
```

**Optional** — ให้แอป user เป็น owner ของ `orders` เพื่อให้ migration แบบ Node ใช้ได้ภายหลัง (รันครั้งเดียว แก้ชื่อ user ในไฟล์ให้ตรง):

```bash
sudo -u postgres psql -d hotpot_kiosk_db -v ON_ERROR_STOP=1 -v app_user=hotpot_user -f scripts/transfer_orders_owner_to_app.sql
```

ไฟล์ SQL: `migrate_kbank.sql`, `verify_kbank_schema.sql`

---

## 🚀 รันบนเซิร์ฟเวอร์ (AWS ฯลฯ) แบบคำสั่งเดียว

จากโฟลเดอร์ `backend` (ต้องมี `.env` ชี้ PostgreSQL แล้ว):

```bash
npm run db:setup
```

หรือ:

```bash
node scripts/setup-database.js
```

จะรันตามลำดับ: SQL สาขา / LINE / unique constraints → `migrate_kbank.js` → `createUsers.js`  
ดูตัวเลือก `SETUP_SKIP_*` และ `SETUP_DRY_RUN` ที่หัวไฟล์ `setup-database.js`

---

## 🚀 วิธีใช้งาน

### 1. Grant Permission ใน pgAdmin (ทำครั้งเดียว)

รัน SQL นี้ใน pgAdmin Query Tool:

```sql
-- Grant permissions ให้ hotpot_user
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO hotpot_user;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO hotpot_user;

-- Grant permissions ให้ทุกตาราง (ถ้าต้องการ)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hotpot_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hotpot_user;

-- Grant permissions สำหรับตารางใหม่ที่สร้างในอนาคต
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hotpot_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO hotpot_user;
```

### 2. รัน Script

```bash
cd backend
node scripts/createUsers.js
```

## 📋 Users ที่จะถูกสร้าง (ตามดีไซด์)

| Username | Password | User Type | ใช้งานสำหรับ |
|----------|----------|-----------|--------------|
| `admin` | `admin123` | `admin` | CMS - จัดการทุกอย่าง (เข้าไปแล้วไปที่ AdminScreen) |
| `user` | `user123` | `kiosk` | Standard User - เข้าไปแล้วเลือกได้ว่าจะใช้ Kiosk, Kitchen, หรือ Queue |

## ⚠️ หมายเหตุ

- เปลี่ยนรหัสผ่านเมื่อใช้งานจริง
- Passwords ถูก hash ด้วย bcrypt (ปลอดภัย)

---

## 🗑️ การจัดการข้อมูลออเดอร์

ดูรายละเอียดใน `README_DELETE_ORDERS.md`

### ตรวจสอบข้อมูลออเดอร์
```sql
-- ใช้ไฟล์ checkOrders.sql ใน pgAdmin
```

### ลบข้อมูลออเดอร์
```sql
-- ใช้ไฟล์ deleteAllOrders.sql หรือ deleteOrdersByDate.sql ใน pgAdmin
-- ⚠️ ระวัง: การลบข้อมูลไม่สามารถกู้คืนได้!
```

