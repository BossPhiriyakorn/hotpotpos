# 📋 คู่มือการตั้งค่า LINE Notification System

## ✅ สรุปสิ่งที่ต้องทำ

### 🔴 ส่วนที่คุณต้องทำใน pgAdmin:

1. **สร้าง Database Table**
   - เปิด pgAdmin
   - เชื่อมต่อกับ Database `hotpot_kiosk_db`
   - ไปที่ **Tools** → **Query Tool**
   - เปิดไฟล์ `backend/scripts/createLineNotificationsTable.sql`
   - Copy ทั้งหมดแล้ว Paste ลงใน Query Tool
   - กด **F5** เพื่อ Execute
   - ตรวจสอบว่าเห็น `line_notifications table created successfully`

---

### 🔴 ส่วนที่คุณต้องทำใน LINE Developers Console:

1. **สร้าง Provider และ Messaging API Channel**
   - ไปที่ https://developers.line.biz/
   - Login ด้วย LINE Account
   - สร้าง Provider → สร้าง Messaging API Channel
   - Copy Credentials:
     - Channel ID
     - Channel Secret
     - Channel Access Token (Long-lived)

2. **ตั้งค่า Environment Variables**
   - เปิดไฟล์ `backend/.env`
   - เพิ่ม:
     ```env
     LINE_CHANNEL_ID=your_channel_id
     LINE_CHANNEL_SECRET=your_channel_secret
     LINE_CHANNEL_ACCESS_TOKEN=your_access_token
     LINE_BASE_URL=http://localhost:3001
     ```

---

### ✅ ส่วนที่ระบบทำให้แล้ว:

1. ✅ สร้าง Backend API endpoints
2. ✅ สร้าง Frontend screens
3. ✅ สร้าง QR Code generator
4. ✅ สร้างระบบส่งข้อความแจ้งเตือน
5. ✅ แก้ไข MemberScanScreen ให้ปุ่มทำงาน
6. ✅ เพิ่ม dependencies ใน package.json

---

## 🚀 ขั้นตอนการทดสอบ

### 1. ติดตั้ง Dependencies
```bash
cd backend
npm install
```

### 2. รัน Backend Server
```bash
npm run dev
```

### 3. ทดสอบใน Frontend
1. สร้างออเดอร์ใหม่
2. ไปที่หน้า "สะสมคะแนนสมาชิก"
3. กดปุ่ม **"รับแจ้งเตือนคิว"**
4. ควรเห็น QR Code สำหรับสแกน
5. สแกนด้วย LINE App
6. ควรได้รับข้อความแจ้งเตือน

---

## 📝 หมายเหตุ

- **Database Table**: ต้องสร้างใน pgAdmin ก่อน
- **LINE Credentials**: ต้องได้จาก LINE Developers Console
- **Environment Variables**: ต้องตั้งค่าใน `backend/.env`

ดูรายละเอียดเพิ่มเติมใน `backend/scripts/README_LINE_SETUP.md`

