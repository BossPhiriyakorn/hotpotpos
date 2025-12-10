# 🚀 ขั้นตอนการ Deploy LINE Notification Fix บน AWS EC2

## 📋 Checklist ก่อน Deploy

- [ ] ตรวจสอบว่ามีตาราง `line_notifications` ใน Database
- [ ] ตรวจสอบ Environment Variables ใน Backend `.env`
- [ ] ตรวจสอบ Environment Variables ใน Frontend `.env.production`
- [ ] Backup Database (ถ้าต้องการ)

---

## 🔧 ขั้นตอนที่ 1: SSH เข้าเซิร์ฟเวอร์

```bash
ssh username@your-server-ip
# หรือ
ssh -i /path/to/your-key.pem ubuntu@your-server-ip
```

---

## 🔧 ขั้นตอนที่ 2: ไปที่โฟลเดอร์โปรเจค

```bash
cd /path/to/your/project
# ตัวอย่าง: cd /home/ubuntu/hotpot
```

---

## 🔧 ขั้นตอนที่ 3: Pull โค้ดล่าสุด

```bash
git pull origin main
# หรือ
git pull origin master
```

---

## 🔧 ขั้นตอนที่ 4: ตรวจสอบ Database

### 4.1 เชื่อมต่อ PostgreSQL

```bash
sudo -u postgres psql -d hotpot_kiosk_db
```

### 4.2 ตรวจสอบว่ามีตาราง `line_notifications` หรือไม่

```sql
-- ตรวจสอบว่ามีตารางหรือไม่
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'line_notifications';

-- ถ้ามีตารางแล้ว ตรวจสอบโครงสร้าง
\d line_notifications

-- ตรวจสอบข้อมูล (ถ้ามี)
SELECT COUNT(*) FROM line_notifications;
```

### 4.3 ถ้ายังไม่มีตาราง ให้สร้าง

```sql
-- ออกจาก psql
\q

-- รัน SQL script
sudo -u postgres psql -d hotpot_kiosk_db -f backend/scripts/createLineNotificationsTable.sql
```

---

## 🔧 ขั้นตอนที่ 5: ตรวจสอบ Environment Variables

### 5.1 ตรวจสอบ Backend `.env`

```bash
cd backend
cat .env | grep LINE
```

**ต้องมี**:
```env
LINE_CHANNEL_ID=your_messaging_api_channel_id
LINE_CHANNEL_SECRET=your_messaging_api_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_messaging_api_access_token
LINE_LIFF_ID=your_liff_id
LINE_BASE_URL=https://posproject.tectony.co.th
LINE_WEBHOOK_URL=https://posproject.tectony.co.th/api/line/webhook
```

### 5.2 ตรวจสอบ Frontend `.env.production`

```bash
cd ..
cat .env.production | grep LINE
```

**ต้องมี**:
```env
VITE_LINE_LIFF_ID=your_liff_id
```

### 5.3 แก้ไข Environment Variables (ถ้าจำเป็น)

```bash
# Backend
nano backend/.env

# Frontend
nano .env.production
```

---

## 🔧 ขั้นตอนที่ 6: Build Frontend

```bash
# กลับไปที่ root directory
cd /path/to/your/project

# Install dependencies (ถ้ายังไม่ได้ install)
npm install

# Build Frontend
npm run build
```

**ตรวจสอบผลลัพธ์**:
```bash
# ตรวจสอบว่า build สำเร็จ
ls -la dist/
```

---

## 🔧 ขั้นตอนที่ 7: Restart Services

### 7.1 Restart Backend

```bash
pm2 restart backend
# หรือ
pm2 restart all
```

### 7.2 Restart Frontend

```bash
pm2 restart frontend
```

### 7.3 ตรวจสอบ Status

```bash
pm2 status
```

**ควรเห็น**:
- `backend` → `online`
- `frontend` → `online`

---

## 🔧 ขั้นตอนที่ 8: ตรวจสอบ Logs

### 8.1 ตรวจสอบ Backend Logs

```bash
pm2 logs backend --lines 50
```

**ตรวจสอบ**:
- ไม่มี error เกี่ยวกับ LINE
- ไม่มี error เกี่ยวกับ database

### 8.2 ตรวจสอบ Frontend Logs

```bash
pm2 logs frontend --lines 50
```

---

## 🔧 ขั้นตอนที่ 9: ทดสอบระบบ

### 9.1 ทดสอบ QR Code Generation

```bash
# ใช้ curl หรือ browser
curl https://posproject.tectony.co.th/api/line/qrcode/1
```

**ตรวจสอบ**:
- QR Code ถูกสร้างสำเร็จ
- URL ใน QR Code ใช้ hash fragment (`#order_id=...`)

### 9.2 ทดสอบ LINE Connect

1. สร้างออเดอร์ใหม่
2. สแกน QR Code ด้วย LINE App
3. ตรวจสอบว่า:
   - เปิด LINE App ได้
   - ไม่แสดง error "ไม่พบข้อมูลออเดอร์"
   - แสดงข้อความ "เชื่อมต่อ LINE สำเร็จแล้ว!"

### 9.3 ทดสอบ Notification

1. สร้างออเดอร์ใหม่
2. สแกน QR Code เพื่อเชื่อมต่อ LINE
3. อัพเดทสถานะออเดอร์ใน Kitchen
4. ตรวจสอบว่าได้รับข้อความแจ้งเตือนใน LINE

---

## 🔧 ขั้นตอนที่ 10: ตรวจสอบ Database

### 10.1 ตรวจสอบการเชื่อมต่อ LINE

```bash
sudo -u postgres psql -d hotpot_kiosk_db
```

```sql
-- ตรวจสอบการเชื่อมต่อ LINE
SELECT 
  ln.id,
  ln.order_id,
  ln.line_user_id,
  ln.line_display_name,
  ln.notification_enabled,
  o.queue_number,
  o.order_status
FROM line_notifications ln
JOIN orders o ON ln.order_id = o.id
ORDER BY ln.created_at DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### ปัญหา: QR Code ไม่แสดง

**ตรวจสอบ**:
```bash
# ตรวจสอบ Backend logs
pm2 logs backend --lines 100 | grep -i "qrcode\|line"

# ตรวจสอบ Environment Variables
cat backend/.env | grep LINE_LIFF_ID
```

---

### ปัญหา: Error "ไม่พบข้อมูลออเดอร์"

**ตรวจสอบ**:
1. ตรวจสอบว่า QR Code ใช้ hash fragment (`#order_id=...`)
2. ตรวจสอบ Frontend logs:
   ```bash
   pm2 logs frontend --lines 100 | grep -i "order\|hash"
   ```
3. ตรวจสอบ Browser Console (F12) ใน LINE App

---

### ปัญหา: ไม่ได้รับ Notification

**ตรวจสอบ**:
1. ตรวจสอบว่า LINE User ID ถูกบันทึกใน Database:
   ```sql
   SELECT * FROM line_notifications WHERE order_id = YOUR_ORDER_ID;
   ```
2. ตรวจสอบ Backend logs:
   ```bash
   pm2 logs backend --lines 100 | grep -i "notification\|line"
   ```
3. ตรวจสอบ LINE Channel Access Token:
   ```bash
   cat backend/.env | grep LINE_CHANNEL_ACCESS_TOKEN
   ```

---

### ปัญหา: Database Error

**ตรวจสอบ**:
```bash
# ตรวจสอบ PostgreSQL status
sudo systemctl status postgresql

# ตรวจสอบ Database connection
sudo -u postgres psql -d hotpot_kiosk_db -c "SELECT 1;"
```

---

## ✅ Checklist หลัง Deploy

- [ ] QR Code ถูกสร้างสำเร็จ
- [ ] สแกน QR Code แล้วเปิด LINE App ได้
- [ ] ไม่แสดง error "ไม่พบข้อมูลออเดอร์"
- [ ] LINE User ID ถูกบันทึกใน Database
- [ ] ได้รับ notification เมื่อสร้างออเดอร์
- [ ] ได้รับ notification เมื่ออัพเดทสถานะ
- [ ] Backend และ Frontend ทำงานปกติ

---

## 📞 Support

ถ้ามีปัญหา:
1. ตรวจสอบ Logs: `pm2 logs`
2. ตรวจสอบ Database: `sudo -u postgres psql -d hotpot_kiosk_db`
3. ตรวจสอบ Environment Variables: `cat backend/.env`

