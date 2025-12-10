# 📱 คู่มือการตั้งค่า LINE Messaging API

## 📋 สรุป
ระบบแจ้งเตือนคิวผ่าน LINE ใช้ **2 LINE Channels**:
1. **LINE Messaging API Channel** - สำหรับส่งข้อความแจ้งเตือน
2. **LINE Login Channel** - สำหรับ LIFF App เพื่อรับ LINE User ID

⚠️ **สำคัญ**: LINE เปลี่ยนนโยบายแล้ว - Messaging API Channel ไม่สามารถเพิ่ม LIFF apps ได้ ต้องใช้ LINE Login Channel แยก

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

### 2.2 สร้าง Messaging API Channel (Channel 1)
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

### 2.3 ดู Messaging API Credentials
1. ไปที่ Messaging API Channel → แท็บ **"Basic settings"**
2. Copy ค่าเหล่านี้:
   - **Channel ID** → ใส่ใน `LINE_CHANNEL_ID`
   - **Channel secret** → ใส่ใน `LINE_CHANNEL_SECRET`
3. ไปที่แท็บ **"Messaging API"**
4. Scroll ลงไปที่ **"Channel access token"**
5. กด **"Issue"** → Copy Token → ใส่ใน `LINE_CHANNEL_ACCESS_TOKEN`
   - **สำคัญ**: เลือก **"Long-lived token"** (ใช้ได้นาน)

### 2.4 ตั้งค่า Webhook (Optional)
1. ไปที่ Messaging API Channel → แท็บ **"Messaging API"**
2. Scroll ลงไปที่ **"Webhook settings"**
3. ใส่ Webhook URL: `https://your-domain.com/api/line/webhook`
   - Development: ใช้ ngrok (เช่น `https://abc123.ngrok.io/api/line/webhook`)
   - Production: ใช้ domain จริง
4. กด **"Update"**
5. Enable Webhook (เปิดสวิตช์)

### 2.5 สร้าง LINE Login Channel (Channel 2)
1. ใน Provider เดียวกัน → กด **"Add a channel"**
2. เลือก **"LINE Login"**
3. กรอกข้อมูล:
   - **Channel name**: "Hotpot Kiosk Login"
   - **Channel description**: "ระบบรับ LINE User ID"
   - **Category**: "Food & Drink"
   - **Subcategory**: "Restaurant"
   - **Email**: อีเมลของลูกค้า
4. กด **"Create"**
5. อ่านและยอมรับ **Terms of Use**

### 2.6 ดู LINE Login Credentials
1. ไปที่ LINE Login Channel → แท็บ **"Basic settings"**
2. Copy ค่าเหล่านี้:
   - **Channel ID** → ใส่ใน `LINE_LOGIN_CHANNEL_ID`
   - **Channel secret** → ใส่ใน `LINE_LOGIN_CHANNEL_SECRET`

### 2.7 สร้าง LIFF App ใน LINE Login Channel
1. ไปที่ LINE Login Channel → แท็บ **"LINE Login"**
2. Scroll ลงไปที่ **"LIFF apps"**
3. กด **"Add"** → สร้าง LIFF App:
   - **LIFF app name**: "Hotpot Order Connect"
   - **Size**: `Full` หรือ `Tall` (แนะนำ `Full`)
   - **Endpoint URL**: `https://your-domain.com/line/connect`
     - Development: `http://localhost:5173/line/connect`
     - Production: `https://your-domain.com/line/connect`
   - **Scope**: เลือก `profile` และ `openid`
4. กด **"Create"**
5. Copy **LIFF ID** → ใส่ใน `LINE_LIFF_ID`

---

## ⚙️ ขั้นตอนที่ 3: ตั้งค่า Environment Variables

### 3.1 แก้ไข `backend/.env`
เปิดไฟล์ `backend/.env` และเพิ่ม:

```env
# ============================================
# LINE Messaging API Configuration (Channel 1)
# ============================================
LINE_CHANNEL_ID=your_messaging_api_channel_id
LINE_CHANNEL_SECRET=your_messaging_api_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_messaging_api_access_token

# ============================================
# LINE Login Configuration (Channel 2)
# ============================================
LINE_LOGIN_CHANNEL_ID=your_line_login_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_line_login_channel_secret
LINE_LIFF_ID=your_liff_id

# ============================================
# LINE URLs
# ============================================
# Base URL สำหรับสร้าง QR Code
# Development: http://localhost:5173
# Production: https://your-domain.com
LINE_BASE_URL=http://localhost:5173

# Webhook URL (Optional)
LINE_WEBHOOK_URL=https://your-domain.com/api/line/webhook
```

### 3.2 แทนที่ค่าด้วย Credentials จริง

**Messaging API Channel (Channel 1):**
- `LINE_CHANNEL_ID` → จาก Messaging API Channel → Basic settings
- `LINE_CHANNEL_SECRET` → จาก Messaging API Channel → Basic settings
- `LINE_CHANNEL_ACCESS_TOKEN` → จาก Messaging API Channel → Messaging API → Issue token

**LINE Login Channel (Channel 2):**
- `LINE_LOGIN_CHANNEL_ID` → จาก LINE Login Channel → Basic settings
- `LINE_LOGIN_CHANNEL_SECRET` → จาก LINE Login Channel → Basic settings
- `LINE_LIFF_ID` → จาก LINE Login Channel → LINE Login → LIFF apps → LIFF ID

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
- LINE User ID จะได้จาก LINE Login (LIFF) อัตโนมัติ
- เมื่อสแกน QR Code ผ่าน LINE App, LIFF SDK จะส่ง LINE User ID อัตโนมัติ
- ต้องใช้ LINE Login Channel และ LIFF App เพื่อรับ LINE User ID

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
- [ ] สร้าง LINE Provider
- [ ] สร้าง Messaging API Channel (Channel 1)
- [ ] Copy Messaging API Credentials (Channel ID, Secret, Access Token)
- [ ] สร้าง LINE Login Channel (Channel 2)
- [ ] Copy LINE Login Credentials (Channel ID, Secret)
- [ ] สร้าง LIFF App ใน LINE Login Channel
- [ ] Copy LIFF ID
- [ ] ตั้งค่า Environment Variables ใน `.env` (ทั้ง 2 Channels)
- [ ] ตั้งค่า `VITE_LINE_LIFF_ID` ใน Frontend `.env`
- [ ] ติดตั้ง Dependencies (`npm install`)
- [ ] รัน Backend Server (`npm run dev`)
- [ ] รัน Frontend (`npm run dev`)
- [ ] ทดสอบ Generate QR Code
- [ ] ทดสอบสแกน QR Code ด้วย LINE App
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

