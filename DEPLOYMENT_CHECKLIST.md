# ✅ Deployment Checklist

## 📋 Pre-Deployment

### Code Preparation
- [x] เพิ่ม React Router และ route `/line/connect` ใน `App.tsx`
- [x] ติดตั้ง `react-router-dom` package
- [x] แก้ไข `LineConnectScreen.tsx` ให้ทำงานกับ LINE User ID
- [x] สร้างไฟล์ configuration สำหรับ production
- [x] สร้าง Nginx config example
- [x] สร้าง PM2 ecosystem config
- [x] สร้าง Deployment documentation

### Environment Variables
- [ ] สร้าง Frontend `.env.production` จาก `.env.production.example`
- [ ] สร้าง Backend `.env` จาก `backend/.env.production.example`
- [ ] ตั้งค่า Database credentials
- [ ] ตั้งค่า LINE API credentials
- [ ] เปลี่ยน JWT_SECRET เป็นค่าที่ปลอดภัย

### Database
- [ ] สร้าง Database และ User ใน PostgreSQL
- [ ] รัน SQL scripts:
  - [ ] `backend/scripts/createTables.sql`
  - [ ] `backend/scripts/createLineNotificationsTable.sql`
  - [ ] `backend/scripts/seedData.sql` (ถ้ามี)
- [ ] รัน `backend/scripts/createUsers.js` เพื่อสร้าง users

---

## 🚀 Deployment Steps

### Server Setup
- [ ] ติดตั้ง Node.js 18+
- [ ] ติดตั้ง PostgreSQL 12+
- [ ] ติดตั้ง Nginx
- [ ] ติดตั้ง PM2
- [ ] ติดตั้ง Certbot (สำหรับ SSL)

### Code Deployment
- [ ] Clone หรือ Upload code ไปยัง Server
- [ ] ติดตั้ง Frontend dependencies: `npm install`
- [ ] ติดตั้ง Backend dependencies: `cd backend && npm install`
- [ ] Build Frontend: `npm run build`
- [ ] Build Backend: `cd backend && npm run build`

### Configuration
- [ ] ตั้งค่า Frontend `.env.production`
- [ ] ตั้งค่า Backend `.env`
- [ ] Setup Nginx configuration
- [ ] Setup SSL Certificate
- [ ] รัน Backend ด้วย PM2

### Testing
- [ ] ทดสอบ Frontend: `https://your-domain.com`
- [ ] ทดสอบ Backend API: `https://your-domain.com/api/health`
- [ ] ทดสอบ Login
- [ ] ทดสอบสร้างออเดอร์
- [ ] ทดสอบ LINE Notification:
  - [ ] Generate QR Code
  - [ ] สแกน QR Code
  - [ ] เชื่อมต่อ LINE สำเร็จ
  - [ ] ส่งแจ้งเตือน

---

## 🔒 Security Checklist

- [ ] เปลี่ยน JWT_SECRET เป็นค่าที่ปลอดภัย
- [ ] ใช้รหัสผ่าน Database ที่แข็งแรง
- [ ] ตั้ง `DB_SSL=true` สำหรับ Production Database
- [ ] ตรวจสอบ CORS settings
- [ ] ตั้งค่า Firewall rules
- [ ] ตรวจสอบ SSL Certificate ถูกต้อง
- [ ] ตรวจสอบ Security Headers ใน Nginx

---

## 📝 Post-Deployment

### Monitoring
- [ ] ตั้งค่า Monitoring (ถ้าต้องการ)
- [ ] ตั้งค่า Log Rotation
- [ ] ตั้งค่า Backup Database

### Documentation
- [ ] บันทึก Domain และ Credentials
- [ ] บันทึก Database credentials
- [ ] บันทึก LINE API credentials
- [ ] สร้าง Runbook สำหรับ Operations

---

## 🔄 Update Process

เมื่อต้องการอัพเดท:
1. Pull latest code
2. Install dependencies (ถ้ามี)
3. Rebuild Frontend และ Backend
4. Restart Backend: `pm2 restart hotpot-backend`
5. ทดสอบทุกฟังก์ชัน

---

## 🆘 Emergency Contacts

- Database Admin: [contact]
- Server Admin: [contact]
- LINE API Support: https://developers.line.biz/

