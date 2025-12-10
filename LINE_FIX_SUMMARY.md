# 📋 สรุปการแก้ไข LINE Notification System

## ✅ สิ่งที่แก้ไขแล้ว

### 1. Backend - QR Code URL Generation (`backend/src/controllers/lineController.ts`)

**ปัญหา**: LIFF URL ไม่ส่ง query parameters ไปยัง Endpoint URL

**การแก้ไข**: เปลี่ยนจาก query string (`?order_id=...`) เป็น hash fragment (`#order_id=...`)

```typescript
// เดิม
qrData = `https://liff.line.me/${liffId}?order_id=${order.id}&token=${token}`;

// แก้ไขเป็น
qrData = `https://liff.line.me/${liffId}#order_id=${order.id}&token=${token}`;
```

**เหตุผล**: LIFF SDK สามารถดึง hash parameters ได้ แต่ไม่สามารถดึง query parameters ที่ส่งผ่าน LIFF URL ได้

---

### 2. Frontend - Parameter Extraction (`modules/line/LineConnectScreen.tsx`)

**ปัญหา**: ไม่สามารถดึง `order_id` และ `token` จาก hash fragment

**การแก้ไข**: เปลี่ยนลำดับการดึง parameters ให้ดึงจาก hash fragment ก่อน

```typescript
// 1. ดึงจาก hash fragment ก่อน (สำหรับ LIFF URL ที่ใช้ hash)
if (window.location.hash) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  orderId = hashParams.get('order_id');
  token = hashParams.get('token');
}

// 2. Fallback: LIFF query parameters
// 3. Fallback: URL search params
// 4. Fallback: window.location.search
```

**เหตุผล**: ต้องดึงจาก hash fragment ก่อนเพราะ LIFF URL ใช้ hash fragment

---

### 3. Backend - Kitchen Status Notifications (`backend/src/controllers/kitchenController.ts`)

**ปัญหา**: ส่ง notification เฉพาะเมื่อ status เป็น 'ready' หรือ 'done' เท่านั้น

**การแก้ไข**: เพิ่ม notification สำหรับ 'in-progress' status

```typescript
// เดิม
if (status === 'ready' || status === 'done') {
  await notifyOrderStatusChange(id, status);
}

// แก้ไขเป็น
if (status === 'done') {
  notificationStatus = 'done';
} else if (status === 'ready') {
  notificationStatus = 'ready';
} else if (status === 'in-progress') {
  notificationStatus = 'in_progress';
}
```

**สถานะที่ส่ง notification**:
- `queued` - เมื่อออเดอร์ถูกสร้าง
- `in_progress` - เมื่อเริ่มเตรียมอาหาร
- `ready` - เมื่ออาหารพร้อม
- `done` - เมื่ออาหารเสร็จสมบูรณ์

---

### 4. Backend - Order Creation Notification (`backend/src/controllers/orderController.ts`)

**ปัญหา**: ไม่ส่ง notification เมื่อออเดอร์ถูกสร้าง

**การแก้ไข**: เพิ่มการส่ง notification เมื่อสร้างออเดอร์สำเร็จ

```typescript
await client.query('COMMIT');

// Send LINE notification when order is created (queued)
try {
  const { notifyOrderStatusChange } = await import('./lineController.js');
  await notifyOrderStatusChange(order.id, 'queued');
} catch (error) {
  console.warn('Failed to send LINE notification:', error);
}
```

**เหตุผล**: ให้ลูกค้ารับทราบทันทีว่าออเดอร์ถูกเพิ่มเข้าคิวแล้ว

---

## 📊 Database

### ตาราง `line_notifications`

**ไม่ต้องเพิ่มตารางใหม่** - ตารางมีอยู่แล้ว

**โครงสร้าง**:
- `id` - Primary Key
- `order_id` - Foreign Key to orders
- `line_user_id` - LINE User ID ของลูกค้า
- `line_display_name` - ชื่อที่แสดงใน LINE
- `notification_enabled` - เปิด/ปิดการแจ้งเตือน
- `created_at` - วันที่สร้าง
- `updated_at` - วันที่อัพเดท

**ตรวจสอบว่ามีตารางหรือไม่**:
```sql
SELECT * FROM line_notifications LIMIT 1;
```

**ถ้ายังไม่มี ให้รัน**:
```sql
\i backend/scripts/createLineNotificationsTable.sql
```

---

## 🔄 Flow การทำงาน

### 1. สร้างออเดอร์
```
ลูกค้าสั่งอาหาร → สร้างออเดอร์ → ส่ง notification 'queued'
```

### 2. สแกน QR Code
```
ลูกค้าสแกน QR Code → เปิด LINE App → ดึง order_id จาก hash
→ ดึง LINE User ID จาก LIFF SDK → เชื่อมต่อ LINE User ID กับ Order
→ ส่ง notification 'queued' (ยืนยันการเชื่อมต่อ)
```

### 3. อัพเดทสถานะออเดอร์
```
Kitchen อัพเดทสถานะ → ส่ง notification ตามสถานะ:
- 'in-progress' → 'in_progress'
- 'ready' → 'ready'
- 'done' → 'done'
```

---

## 📝 ไฟล์ที่แก้ไข

1. ✅ `backend/src/controllers/lineController.ts` - QR Code URL generation
2. ✅ `modules/line/LineConnectScreen.tsx` - Parameter extraction
3. ✅ `backend/src/controllers/kitchenController.ts` - Kitchen notifications
4. ✅ `backend/src/controllers/orderController.ts` - Order creation notification

---

## 🚀 ขั้นตอนการ Deploy บน AWS

ดูไฟล์ `AWS_DEPLOYMENT_STEPS.md` สำหรับคำสั่งทั้งหมด

