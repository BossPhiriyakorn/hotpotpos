# 📋 สรุปการแก้ไข LINE Integration (2 Channels)

## ✅ สิ่งที่แก้ไขแล้ว

### 1. Backend (`backend/src/controllers/lineController.ts`)
- ✅ แก้ไขให้ใช้ LIFF URL เมื่อมี `LINE_LIFF_ID`
- ✅ QR Code จะชี้ไปที่ `https://liff.line.me/{LIFF_ID}?order_id=...&token=...`

### 2. Frontend (`modules/line/LineConnectScreen.tsx`)
- ✅ เพิ่มการรองรับ LIFF SDK
- ✅ Initialize LIFF และ Login อัตโนมัติ
- ✅ ดึง LINE User ID จาก LIFF Profile

### 3. Frontend (`index.html`)
- ✅ เพิ่ม LIFF SDK: `<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>`

### 4. Documentation
- ✅ อัพเดท `backend/scripts/README_LINE_SETUP.md` ให้รวม LINE Login Channel
- ✅ สร้าง `LINE_DEPLOYMENT_GUIDE.md` สำหรับขั้นตอนการ deploy

---

## 🔧 สิ่งที่ต้องทำบนเซิร์ฟเวอร์

### 1. สร้าง LINE Channels (ใน LINE Developers Console)

#### Messaging API Channel (Channel 1)
- สร้าง Provider → สร้าง Messaging API Channel
- Copy: Channel ID, Channel Secret, Channel Access Token (Long-lived)

#### LINE Login Channel (Channel 2)
- สร้าง LINE Login Channel (ใน Provider เดียวกัน)
- Copy: Channel ID, Channel Secret
- สร้าง LIFF App:
  - Endpoint URL: `https://your-domain.com/line/connect`
  - Size: `Full` หรือ `Tall`
  - Scope: `profile` และ `openid`
- Copy: LIFF ID

---

### 2. แก้ไข Backend `.env`

```bash
nano backend/.env
```

เพิ่ม/แก้ไข:

```env
# Messaging API (Channel 1)
LINE_CHANNEL_ID=your_messaging_api_channel_id
LINE_CHANNEL_SECRET=your_messaging_api_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_messaging_api_access_token

# LINE Login (Channel 2)
LINE_LOGIN_CHANNEL_ID=your_line_login_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_line_login_channel_secret
LINE_LIFF_ID=your_liff_id

# URLs
LINE_BASE_URL=https://your-domain.com
LINE_WEBHOOK_URL=https://your-domain.com/api/line/webhook
```

---

### 3. แก้ไข Frontend `.env`

```bash
nano .env
```

หรือ

```bash
nano .env.production
```

เพิ่ม:

```env
VITE_LINE_LIFF_ID=your_liff_id
```

---

### 4. Build และ Restart

```bash
# Build Frontend
npm run build

# Restart Backend
pm2 restart backend

# Restart Frontend
pm2 restart frontend
```

---

## 📝 Checklist

- [ ] สร้าง Messaging API Channel
- [ ] Copy Messaging API Credentials
- [ ] สร้าง LINE Login Channel
- [ ] Copy LINE Login Credentials
- [ ] สร้าง LIFF App
- [ ] Copy LIFF ID
- [ ] แก้ไข `backend/.env` (เพิ่ม LINE Login credentials)
- [ ] แก้ไข Frontend `.env` (เพิ่ม `VITE_LINE_LIFF_ID`)
- [ ] Build Frontend (`npm run build`)
- [ ] Restart Backend (`pm2 restart backend`)
- [ ] Restart Frontend (`pm2 restart frontend`)
- [ ] ทดสอบสแกน QR Code

---

## 📚 เอกสารเพิ่มเติม

- **คู่มือการตั้งค่า**: `backend/scripts/README_LINE_SETUP.md`
- **คู่มือการ Deploy**: `LINE_DEPLOYMENT_GUIDE.md`

---

## ⚠️ หมายเหตุสำคัญ

1. **ต้องใช้ 2 Channels แยกกัน** - Messaging API Channel ไม่สามารถเพิ่ม LIFF apps ได้แล้ว
2. **LIFF ID ต้องตั้งค่าทั้ง Backend และ Frontend**
3. **ต้อง Rebuild Frontend** หลังจากแก้ไข `.env`
4. **ต้อง Restart ทั้ง Backend และ Frontend** หลังจากแก้ไข Environment Variables

