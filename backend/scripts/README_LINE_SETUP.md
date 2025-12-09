# 📱 คู่มือการตั้งค่า LINE Messaging API

## 📋 สรุป
ระบบแจ้งเตือนคิวผ่าน LINE ใช้ **LINE Messaging API** เพื่อส่งข้อความแจ้งเตือนให้ลูกค้าเมื่อออเดอร์เปลี่ยนสถานะ

---

## 🔧 ขั้นตอนที่ 1: สร้าง Database Table

### 1.1 เปิด pgAdmin
1. เปิด pgAdmin 4
2. เชื่อมต่อกับ Database `hotpot_kiosk_db`

### 1.2 รัน SQL Script
1. ไปที่ **Tools** → **Query Tool** (หรือกด `Alt + Shift + Q`)
2. เปิดไฟล์ `backend/scripts/createLineNotificationsTable.sql`
3. Copy ทั้งหมดแล้ว Paste ลงใน Query Tool
4. กด **F5** หรือคลิก **Execute** (▶)
5. ตรวจสอบผลลัพธ์:
   - ควรเห็น `line_notifications table created successfully`
   - ควรเห็น `existing_records: 0`

### 1.3 ตรวจสอบ Table
1. ใน pgAdmin → **hotpot_kiosk_db** → **Schemas** → **public** → **Tables**
2. กด **F5** เพื่อ Refresh
3. ควรเห็นตาราง `line_notifications`

---

## 🔑 ขั้นตอนที่ 2: ตั้งค่า LINE Developers Console

### 2.1 สร้าง Provider
1. ไปที่ https://developers.line.biz/
2. Login ด้วย LINE Account
3. กด **"Create"** → **"Provider"**
4. ตั้งชื่อ Provider (เช่น "Hotpot Kiosk System")
5. กด **"Create"**

### 2.2 สร้าง Messaging API Channel
1. ใน Provider ที่สร้าง → กด **"Add a channel"**
2. เลือก **"Messaging API"**
3. กรอกข้อมูล:
   - **Channel name**: "Hotpot Kiosk Notifications"
   - **Channel description**: "ระบบแจ้งเตือนคิวออเดอร์"
   - **Category**: "Food & Drink"
   - **Subcategory**: "Restaurant"
   - **Email**: อีเมลของลูกค้า
4. กด **"Create"**
5. อ่านและยอมรับ **Terms of Use**

### 2.3 ดู Credentials
1. ไปที่ Channel ที่สร้าง → แท็บ **"Basic settings"**
2. Copy ค่าเหล่านี้:
   - **Channel ID** → ใส่ใน `LINE_CHANNEL_ID`
   - **Channel secret** → ใส่ใน `LINE_CHANNEL_SECRET`
3. ไปที่แท็บ **"Messaging API"**
4. Scroll ลงไปที่ **"Channel access token"**
5. กด **"Issue"** → Copy Token → ใส่ใน `LINE_CHANNEL_ACCESS_TOKEN`
   - **สำคัญ**: เลือก **"Long-lived token"** (ใช้ได้นาน)

### 2.4 ตั้งค่า Webhook (Optional)
1. ไปที่แท็บ **"Messaging API"**
2. Scroll ลงไปที่ **"Webhook settings"**
3. ใส่ Webhook URL: `https://your-domain.com/api/line/webhook`
   - Development: ใช้ ngrok (เช่น `https://abc123.ngrok.io/api/line/webhook`)
   - Production: ใช้ domain จริง
4. กด **"Update"**
5. Enable Webhook (เปิดสวิตช์)

---

## ⚙️ ขั้นตอนที่ 3: ตั้งค่า Environment Variables

### 3.1 แก้ไข `backend/.env`
เปิดไฟล์ `backend/.env` และเพิ่ม:

```env
# ============================================
# LINE Messaging API Configuration
# ============================================
LINE_CHANNEL_ID=your_line_channel_id_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here

# Base URL สำหรับสร้าง QR Code
# Development: http://localhost:3001
# Production: https://your-domain.com
LINE_BASE_URL=http://localhost:3001

# Webhook URL (Optional)
LINE_WEBHOOK_URL=https://your-domain.com/api/line/webhook
```

### 3.2 แทนที่ค่าด้วย Credentials จริง
- `LINE_CHANNEL_ID` → จาก Basic settings
- `LINE_CHANNEL_SECRET` → จาก Basic settings
- `LINE_CHANNEL_ACCESS_TOKEN` → จาก Messaging API (Issue token)

---

## 📦 ขั้นตอนที่ 4: ติดตั้ง Dependencies

### 4.1 ติดตั้ง Backend Dependencies
```bash
cd backend
npm install
```

จะติดตั้ง:
- `@line/bot-sdk` - LINE Messaging API SDK
- `qrcode` - สำหรับสร้าง QR Code
- `axios` - สำหรับ HTTP requests

---

## 🚀 ขั้นตอนที่ 5: ทดสอบระบบ

### 5.1 รัน Backend Server
```bash
cd backend
npm run dev
```

### 5.2 ทดสอบ API Endpoints
1. **Health Check**: `http://localhost:3001/api/health`
2. **Generate QR Code**: `http://localhost:3001/api/line/orders/1/qr`
   - แทน `1` ด้วย Order ID จริง

### 5.3 ทดสอบใน Frontend
1. สร้างออเดอร์ใหม่
2. ไปที่หน้า "สะสมคะแนนสมาชิก"
3. กดปุ่ม **"รับแจ้งเตือนคิว"**
4. ควรเห็น QR Code สำหรับสแกน
5. สแกนด้วย LINE App
6. ควรได้รับข้อความแจ้งเตือน

---

## 🔄 ขั้นตอนที่ 6: เปลี่ยนเป็น LINE ของลูกค้า (Production)

### 6.1 สำหรับลูกค้า (เจ้าของร้าน)
1. ไปที่ https://developers.line.biz/
2. Login ด้วย LINE Account ของลูกค้า
3. สร้าง Provider และ Messaging API Channel ตามขั้นตอนที่ 2
4. Copy Credentials:
   - Channel ID
   - Channel Secret
   - Channel Access Token
5. ส่งให้ทีมพัฒนา

### 6.2 สำหรับทีมพัฒนา
1. รับ Credentials จากลูกค้า
2. เปิดไฟล์ `backend/.env` ใน Production Server
3. แก้ไขค่า:
   ```env
   LINE_CHANNEL_ID=ลูกค้า_Channel_ID
   LINE_CHANNEL_SECRET=ลูกค้า_Channel_Secret
   LINE_CHANNEL_ACCESS_TOKEN=ลูกค้า_Access_Token
   LINE_BASE_URL=https://ลูกค้า_domain.com
   LINE_WEBHOOK_URL=https://ลูกค้า_domain.com/api/line/webhook
   ```
4. Restart Backend Server
5. ทดสอบส่งข้อความ

---

## 📝 หมายเหตุสำคัญ

### ⚠️ Security
- **อย่า Commit `.env` ลง Git**
- เก็บ Access Token อย่างปลอดภัย
- อย่าเปิดเผยในโค้ดหรือ log

### ⚠️ Channel Access Token
- **Long-lived token**: ใช้ได้นาน (แนะนำ)
- **Short-lived token**: หมดอายุเร็ว (ต้อง refresh)
- ไปที่ Messaging API → Issue → เลือก **"Long-lived"**

### ⚠️ Webhook URL
- ต้องเป็น **HTTPS** เท่านั้น
- Development: ใช้ **ngrok** หรือ tunnel
- Production: ใช้ domain ที่มี **SSL Certificate**

### ⚠️ LINE User ID
- LINE User ID จะได้จาก LINE Login หรือ LINE SDK
- สำหรับการสแกน QR Code, ต้องใช้ LINE Login หรือ LINE SDK
- ตอนนี้ใช้ placeholder (`temp_user`) สำหรับทดสอบ

---

## 🐛 Troubleshooting

### Error: LINE_CHANNEL_ACCESS_TOKEN is not configured
- ตรวจสอบว่าใส่ค่าใน `.env` แล้ว
- Restart Backend Server

### Error: Failed to send LINE message
- ตรวจสอบว่า Access Token ถูกต้อง
- ตรวจสอบว่า Channel ยัง Active อยู่
- ตรวจสอบว่า LINE User ID ถูกต้อง

### QR Code ไม่แสดง
- ตรวจสอบว่า Order ID ถูกต้อง
- ตรวจสอบว่า Backend API ทำงาน
- ตรวจสอบ Console ใน Browser

### ไม่ได้รับแจ้งเตือน
- ตรวจสอบว่า LINE User ID ถูกต้อง
- ตรวจสอบว่า `notification_enabled = true` ใน Database
- ตรวจสอบว่า Order Status เปลี่ยนเป็น `ready` หรือ `done`

---

## ✅ Checklist

- [ ] สร้าง Database table `line_notifications`
- [ ] สร้าง LINE Provider และ Messaging API Channel
- [ ] Copy Credentials (Channel ID, Secret, Access Token)
- [ ] ตั้งค่า Environment Variables ใน `.env`
- [ ] ติดตั้ง Dependencies (`npm install`)
- [ ] รัน Backend Server (`npm run dev`)
- [ ] ทดสอบ Generate QR Code
- [ ] ทดสอบสแกน QR Code ด้วย LINE
- [ ] ทดสอบรับแจ้งเตือน

---

## 📚 เอกสารเพิ่มเติม

- [LINE Developers Console](https://developers.line.biz/)
- [LINE Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Bot SDK for Node.js](https://github.com/line/line-bot-sdk-nodejs)

---

## 🆘 สนับสนุน

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ Console Logs ใน Backend
2. ตรวจสอบ Database (`line_notifications` table)
3. ตรวจสอบ LINE Developers Console → Channel → Messaging API → Logs

