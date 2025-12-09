# Frontend-Backend Integration Guide

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. API Service (`services/api.ts`)
- สร้าง API Service สำหรับเรียก Backend API
- จัดการ JWT token authentication
- Error handling
- Support สำหรับทุก API endpoints

### 2. Environment Configuration
- สร้าง `.env` สำหรับ Frontend (VITE_API_URL)
- Default: `http://localhost:3001`

### 3. Login Screen (`modules/auth/LoginScreen.tsx`)
- ✅ เชื่อมต่อกับ Backend API (`/api/auth/login`)
- ✅ เก็บ JWT token ใน localStorage
- ✅ แสดง error messages
- ✅ Loading state
- ✅ อัพเดท credentials display (admin/user123)

### 4. Menu Context (`store/MenuContext.tsx`)
- ✅ Fetch menu data จาก Backend API
- ✅ Transform API data ให้ตรงกับ Frontend types
- ✅ Fallback ไปที่ constants ถ้า API ล้มเหลว
- ✅ Loading และ error states
- ✅ Refresh function

### 5. Summary Screen (`modules/kiosk/screens/SummaryScreen.tsx`)
- ✅ ส่ง order ไป Backend API (`/api/orders`)
- ✅ Transform order data ให้ตรงกับ Backend format
- ✅ รับ queue number จาก response
- ✅ Error handling

### 6. Queue Display Screen (`modules/queue/QueueDisplayScreen.tsx`)
- ✅ Fetch orders จาก Backend API (`/api/queue/*`)
- ✅ Real-time updates (polling every 5 seconds)
- ✅ Transform API data ให้ตรงกับ Frontend types
- ✅ Fallback ไปที่ mock data ถ้า API ล้มเหลว

### 7. Kitchen Screen (`modules/kitchen/KitchenScreen.tsx`)
- ✅ Fetch orders จาก Backend API (`/api/kitchen`)
- ✅ อัพเดท status ผ่าน Backend API
- ✅ Real-time updates (polling every 5 seconds)
- ✅ Error handling

---

## 📋 API Endpoints ที่ใช้

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Menu
- `GET /api/menu/addons` - Get addons
- `GET /api/menu/soups` - Get soups
- `GET /api/menu/spice-levels` - Get spice levels

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status

### Queue
- `GET /api/queue/ready` - Get ready orders
- `GET /api/queue/in-progress` - Get in-progress orders

### Kitchen
- `GET /api/kitchen` - Get kitchen orders
- `PUT /api/kitchen/:id/status` - Update kitchen status

---

## 🔧 การตั้งค่า

### 1. Environment Variables

สร้างไฟล์ `.env` ใน root directory:

```env
VITE_API_URL=http://localhost:3001
```

### 2. รัน Backend Server

```bash
cd backend
npm install
npm run dev
```

Backend จะรันที่ `http://localhost:3001`

### 3. รัน Frontend

```bash
npm install
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

---

## 🧪 การทดสอบ

### 1. ทดสอบ Login

1. เปิด Browser ไปที่ `http://localhost:5173`
2. Login ด้วย:
   - Admin: `admin` / `admin123`
   - User: `user` / `user123`
3. ตรวจสอบว่า login สำเร็จและ redirect ไปหน้าถัดไป

### 2. ทดสอบ Menu Loading

1. ตรวจสอบว่า menu items (addons, soups, spice levels) โหลดจาก API
2. ถ้า API ล้มเหลว ควร fallback ไปที่ constants

### 3. ทดสอบ Order Creation

1. สร้าง order ผ่าน Kiosk
2. ตรวจสอบว่า order ถูกส่งไป Backend
3. ตรวจสอบ queue number ที่ได้รับ

### 4. ทดสอบ Queue Display

1. เปิด Queue Display screen
2. ตรวจสอบว่า orders โหลดจาก API
3. ตรวจสอบ real-time updates

### 5. ทดสอบ Kitchen Screen

1. เปิด Kitchen screen
2. ตรวจสอบว่า orders โหลดจาก API
3. ทดสอบอัพเดท status
4. ตรวจสอบ real-time updates

---

## ⚠️ หมายเหตุ

1. **Authentication**: JWT token ถูกเก็บใน localStorage
2. **Error Handling**: ทุก API calls มี error handling และ fallback
3. **Real-time Updates**: ใช้ polling (5 seconds) แทน Socket.io (สามารถอัพเดทเป็น Socket.io ในอนาคต)
4. **Data Transformation**: API data ถูก transform ให้ตรงกับ Frontend types

---

## 🚀 ขั้นตอนต่อไป

1. ✅ เชื่อมต่อ Frontend กับ Backend
2. ⏭️ ทดสอบระบบทั้งหมด
3. ⏭️ เพิ่ม Socket.io สำหรับ real-time updates (ถ้าต้องการ)
4. ⏭️ เพิ่ม error boundaries
5. ⏭️ เพิ่ม loading states ที่ดีขึ้น
6. ⏭️ เพิ่ม retry logic สำหรับ failed requests

---

## 📝 Checklist

- [x] สร้าง API Service
- [x] สร้าง Environment Config
- [x] อัพเดท LoginScreen
- [x] อัพเดท MenuContext
- [x] อัพเดท SummaryScreen
- [x] อัพเดท QueueDisplayScreen
- [x] อัพเดท KitchenScreen
- [ ] ทดสอบระบบทั้งหมด
- [ ] เพิ่ม Socket.io (optional)
- [ ] เพิ่ม error boundaries (optional)

