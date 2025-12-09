# 🔄 วิธีรีเซ็ต Auth Settings ใน Frontend

## ⚠️ ปัญหา

หลังจากแก้ไข `SettingsContext.tsx` แล้ว ค่า default จะถูกต้องแล้ว แต่ถ้า localStorage มีค่าเก่าอยู่ มันจะยังใช้ค่าเก่า

## 🔧 วิธีแก้ไข

### วิธีที่ 1: Clear localStorage ใน Browser (แนะนำ)

1. เปิด Browser (Chrome, Edge, Firefox, etc.)
2. กด `F12` เพื่อเปิด Developer Tools
3. ไปที่แท็บ **Console**
4. พิมพ์คำสั่งนี้:

```javascript
localStorage.removeItem('mala_auth_settings');
location.reload();
```

5. กด Enter
6. หน้าเว็บจะรีโหลดและใช้ค่า default ใหม่

### วิธีที่ 2: แก้ไขใน Settings Page

1. Login เข้าระบบ (ใช้ `admin` / `admin123`)
2. ไปที่ **Admin → ตั้งค่าระบบ → รหัสเข้าใช้งาน & Logs**
3. แก้ไขรหัสผ่านให้ถูกต้อง:
   - **Admin Password**: `admin123`
   - **Kiosk Password**: `user123`
4. ค่าใหม่จะถูกบันทึกใน localStorage อัตโนมัติ

### วิธีที่ 3: Clear ทั้งหมด (ถ้าต้องการเริ่มใหม่)

```javascript
// Clear ทุกอย่าง
localStorage.clear();
location.reload();
```

⚠️ **คำเตือน**: วิธีนี้จะลบทุกอย่างใน localStorage รวมถึง shop settings และ layout settings ด้วย

---

## ✅ ตรวจสอบว่าถูกต้องแล้ว

หลังจากรีเซ็ตแล้ว ตรวจสอบว่า:

1. **LoginScreen** แสดง:
   - Admin: `admin` / `admin123` ✓
   - User: `user` / `user123` ✓

2. **Settings Page** แสดง:
   - Admin Password: `admin123` ✓
   - Kiosk Password: `user123` ✓

3. **Login ได้จริง**:
   - Login ด้วย `admin` / `admin123` → ควรเข้าได้ ✓
   - Login ด้วย `user` / `user123` → ควรเข้าได้ ✓

---

## 📝 หมายเหตุ

- Settings page ใช้สำหรับตั้งค่ารหัสผ่านในอนาคต (ถ้าต้องการเปลี่ยน)
- ตอนนี้ Login ใช้ Backend API แล้ว ไม่ได้ใช้ SettingsContext สำหรับ login
- แต่ Settings page ยังแสดงค่าเก่าถ้า localStorage มีค่าเก่า

