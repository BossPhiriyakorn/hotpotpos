# 🚀 คู่มือการ Deploy LINE Integration บนเซิร์ฟเวอร์

## 📋 สรุปการเปลี่ยนแปลง

LINE เปลี่ยนนโยบายแล้ว - **ต้องใช้ 2 Channels แยกกัน**:
1. **Messaging API Channel** - สำหรับส่งข้อความแจ้งเตือน
2. **LINE Login Channel** - สำหรับ LIFF App เพื่อรับ LINE User ID

---

## ✅ Checklist ก่อน Deploy

### 1. สร้าง LINE Channels (ใน LINE Developers Console)

#### 1.1 Messaging API Channel
- [ ] สร้าง Provider
- [ ] สร้าง Messaging API Channel
- [ ] Copy **Channel ID** → `LINE_CHANNEL_ID`
- [ ] Copy **Channel Secret** → `LINE_CHANNEL_SECRET`
- [ ] Issue **Channel Access Token** (Long-lived) → `LINE_CHANNEL_ACCESS_TOKEN`

#### 1.2 LINE Login Channel
- [ ] สร้าง LINE Login Channel (ใน Provider เดียวกัน)
- [ ] Copy **Channel ID** → `LINE_LOGIN_CHANNEL_ID`
- [ ] Copy **Channel Secret** → `LINE_LOGIN_CHANNEL_SECRET`
- [ ] สร้าง **LIFF App**:
  - Endpoint URL: `https://your-domain.com/line/connect`
  - Size: `Full` หรือ `Tall`
  - Scope: `profile` และ `openid`
- [ ] Copy **LIFF ID** → `LINE_LIFF_ID`

---

## 🔧 ขั้นตอนการ Deploy บนเซิร์ฟเวอร์

### ขั้นตอนที่ 1: SSH เข้าเซิร์ฟเวอร์

```bash
ssh username@your-server-ip
```

### ขั้นตอนที่ 2: ไปที่โฟลเดอร์โปรเจค

```bash
cd /path/to/your/project
```

### ขั้นตอนที่ 3: Pull โค้ดล่าสุด

```bash
git pull origin main
```

### ขั้นตอนที่ 4: แก้ไข Backend Environment Variables

```bash
nano backend/.env
```

เพิ่ม/แก้ไขค่าต่อไปนี้:

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
LINE_BASE_URL=https://your-domain.com
LINE_WEBHOOK_URL=https://your-domain.com/api/line/webhook
```

บันทึก: `Ctrl + O`, Enter, `Ctrl + X`

### ขั้นตอนที่ 5: แก้ไข Frontend Environment Variables

```bash
nano .env
```

หรือ

```bash
nano .env.production
```

เพิ่ม/แก้ไขค่าต่อไปนี้:

```env
VITE_LINE_LIFF_ID=your_liff_id
```

บันทึก: `Ctrl + O`, Enter, `Ctrl + X`

### ขั้นตอนที่ 6: Build Frontend

```bash
npm run build
```

### ขั้นตอนที่ 7: Restart Backend (PM2)

```bash
pm2 restart backend
```

หรือ

```bash
pm2 restart all
```

### ขั้นตอนที่ 8: Restart Frontend (PM2)

```bash
pm2 restart frontend
```

หรือ

```bash
pm2 restart all
```

### ขั้นตอนที่ 9: ตรวจสอบ Logs

```bash
# ดู Backend logs
pm2 logs backend

# ดู Frontend logs
pm2 logs frontend

# ดู logs ทั้งหมด
pm2 logs
```

---

## 🔍 ตรวจสอบการทำงาน

### 1. ตรวจสอบ Backend API

```bash
curl https://your-domain.com/api/health
```

### 2. ตรวจสอบ QR Code Generation

```bash
curl https://your-domain.com/api/line/orders/1/qr
```

(แทน `1` ด้วย Order ID จริง)

### 3. ทดสอบใน Frontend

1. เปิดเว็บไซต์: `https://your-domain.com`
2. สร้างออเดอร์ใหม่
3. ไปที่หน้า "สะสมคะแนนสมาชิก"
4. กดปุ่ม **"รับแจ้งเตือนคิว"**
5. ควรเห็น QR Code
6. สแกนด้วย LINE App
7. ควรเชื่อมต่อสำเร็จและได้รับข้อความแจ้งเตือน

---

## 🐛 Troubleshooting

### Error: LINE_LIFF_ID is not configured

**สาเหตุ**: ไม่ได้ตั้งค่า `LINE_LIFF_ID` ใน Backend `.env`

**แก้ไข**:
1. ตรวจสอบว่า `LINE_LIFF_ID` อยู่ใน `backend/.env`
2. Restart Backend: `pm2 restart backend`

### Error: ไม่พบ LINE User ID

**สาเหตุ**: Frontend ไม่ได้ตั้งค่า `VITE_LINE_LIFF_ID` หรือ LIFF SDK ไม่ทำงาน

**แก้ไข**:
1. ตรวจสอบว่า `VITE_LINE_LIFF_ID` อยู่ใน Frontend `.env`
2. Rebuild Frontend: `npm run build`
3. Restart Frontend: `pm2 restart frontend`
4. ตรวจสอบว่า LIFF SDK โหลดใน Browser Console

### QR Code ไม่แสดง

**สาเหตุ**: Backend API ไม่ทำงานหรือ Order ID ไม่ถูกต้อง

**แก้ไข**:
1. ตรวจสอบ Backend logs: `pm2 logs backend`
2. ตรวจสอบว่า Order ID ถูกต้อง
3. ตรวจสอบ Network tab ใน Browser DevTools

### ไม่ได้รับแจ้งเตือน

**สาเหตุ**: LINE User ID ไม่ถูกต้องหรือ Messaging API ไม่ทำงาน

**แก้ไข**:
1. ตรวจสอบว่า `LINE_CHANNEL_ACCESS_TOKEN` ถูกต้อง
2. ตรวจสอบว่า LINE User ID ถูกบันทึกใน Database
3. ตรวจสอบ LINE Developers Console → Messaging API → Logs

---

## 📝 สรุป Environment Variables

### Backend (`backend/.env`)

```env
# Messaging API (Channel 1)
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
LINE_CHANNEL_ACCESS_TOKEN=xxx

# LINE Login (Channel 2)
LINE_LOGIN_CHANNEL_ID=xxx
LINE_LOGIN_CHANNEL_SECRET=xxx
LINE_LIFF_ID=xxx

# URLs
LINE_BASE_URL=https://your-domain.com
LINE_WEBHOOK_URL=https://your-domain.com/api/line/webhook
```

### Frontend (`.env` หรือ `.env.production`)

```env
VITE_LINE_LIFF_ID=xxx
```

---

## ✅ Checklist หลัง Deploy

- [ ] Backend `.env` มีค่าทั้งหมด (Messaging API + LINE Login)
- [ ] Frontend `.env` มี `VITE_LINE_LIFF_ID`
- [ ] Frontend rebuild แล้ว (`npm run build`)
- [ ] Backend restart แล้ว (`pm2 restart backend`)
- [ ] Frontend restart แล้ว (`pm2 restart frontend`)
- [ ] ทดสอบ Generate QR Code สำเร็จ
- [ ] ทดสอบสแกน QR Code ด้วย LINE App สำเร็จ
- [ ] ทดสอบรับแจ้งเตือนสำเร็จ

---

## 📞 สนับสนุน

หากมีปัญหา:
1. ตรวจสอบ PM2 logs: `pm2 logs`
2. ตรวจสอบ Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. ตรวจสอบ Browser Console
4. ตรวจสอบ LINE Developers Console → Channel → Logs

