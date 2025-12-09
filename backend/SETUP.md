# Backend Setup Guide

## 📋 ขั้นตอนการ Setup Backend

### 1. ติดตั้ง Dependencies

```bash
cd backend
npm install
```

### 2. ตั้งค่า Environment Variables

แก้ไขไฟล์ `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotpot_kiosk_db
DB_USER=postgres
DB_PASSWORD=your_password_here  # ← แก้ไขให้ตรงกับรหัสผ่าน PostgreSQL
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=hotpot_dev_secret_key_2024_change_in_production
DB_SSL=false
```

**สำคัญ:** แก้ไข `DB_PASSWORD` ให้ตรงกับรหัสผ่าน PostgreSQL ของคุณ

### 3. รัน Backend Server

```bash
npm run dev
```

ควรเห็น:
```
✅ Connected to PostgreSQL Database
✅ Database test successful: 2025-12-07T...
🚀 Backend server running on http://localhost:3001
📊 Database: hotpot_kiosk_db@localhost:5432
🌐 Frontend URL: http://localhost:5173
🔌 Socket.io enabled for real-time updates
```

### 4. ทดสอบ API

เปิด Browser ไปที่:
- `http://localhost:3001/api/health` - ตรวจสอบ Health
- `http://localhost:3001/api/test` - ทดสอบ Database Query

---

## 🔧 Troubleshooting

### Error: Cannot find module 'pg'
```bash
cd backend
npm install
```

### Error: Database connection failed
1. ตรวจสอบว่า PostgreSQL กำลังรันอยู่
2. ตรวจสอบ `DB_PASSWORD` ใน `.env` ถูกต้อง
3. ตรวจสอบว่า Database `hotpot_kiosk_db` ถูกสร้างแล้ว

### Error: Port 3001 already in use
แก้ไข `PORT` ใน `.env` เป็น port อื่น (เช่น 3002)

---

## 📚 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/test` - Test database
- `GET /api/menu/addons` - Get addons
- `GET /api/menu/soups` - Get soups
- `GET /api/menu/spice-levels` - Get spice levels
- `POST /api/orders` - Create order
- `GET /api/queue/ready` - Get ready orders
- `GET /api/queue/in-progress` - Get in-progress orders

### Protected Endpoints (Require JWT Token)
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/kitchen` - Get kitchen orders
- `PUT /api/kitchen/:id/status` - Update kitchen order status
- `GET /api/settings` - Get settings
- `PUT /api/settings/:key` - Update setting (admin only)

---

## 🚀 Next Steps

1. ✅ ติดตั้ง Dependencies (`npm install`)
2. ✅ แก้ไข `.env` (DB_PASSWORD)
3. ✅ รัน Backend (`npm run dev`)
4. ✅ ทดสอบ API
5. ⏭️ เชื่อมต่อ Frontend กับ Backend

