# 🚀 คู่มือการ Deploy Hotpot Kiosk System

## 📋 สรุป

คู่มือนี้จะช่วยคุณ Deploy Hotpot Kiosk System ไปยัง Production Server

---

## ✅ สิ่งที่ต้องเตรียม

### 1. Server Requirements
- Ubuntu 20.04+ หรือ Linux Distribution อื่น
- Node.js 18+ และ npm
- PostgreSQL 12+
- Nginx
- PM2 (Process Manager)
- SSL Certificate (Let's Encrypt)

### 2. Domain & DNS
- Domain name (เช่น `hotpot-kiosk.com`)
- DNS A record ชี้ไปที่ Server IP

### 3. LINE Messaging API
- Channel ID
- Channel Secret
- Channel Access Token (Long-lived)

---

## 📦 ขั้นตอนที่ 1: เตรียม Server

### 1.1 ติดตั้ง Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 1.2 สร้าง Database
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE hotpot_kiosk_db;
CREATE USER hotpot_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hotpot_kiosk_db TO hotpot_user;
\q
```

---

## 📦 ขั้นตอนที่ 2: Deploy Code

### 2.1 Clone หรือ Upload Code
```bash
# Option 1: Clone from Git
git clone your-repository-url
cd Hotpot

# Option 2: Upload via SCP
# scp -r ./Hotpot user@server:/path/to/app
```

### 2.2 ติดตั้ง Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 2.3 Build
```bash
# Frontend
npm run build
# Output: dist/ folder

# Backend
cd backend
npm run build
# Output: dist/ folder
```

---

## ⚙️ ขั้นตอนที่ 3: ตั้งค่า Environment Variables

### 3.1 Frontend `.env.production`
สร้างไฟล์ `.env.production` ใน root directory:
```env
VITE_API_URL=https://your-domain.com
```

### 3.2 Backend `.env`
สร้างไฟล์ `backend/.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotpot_kiosk_db
DB_USER=hotpot_user
DB_PASSWORD=your_secure_password
DB_SSL=false

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://your-domain.com

# JWT Secret (เปลี่ยนเป็นค่าที่ปลอดภัย!)
JWT_SECRET=your_very_secure_jwt_secret_key_production_2024

# LINE Messaging API
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
LINE_BASE_URL=https://your-domain.com
LINE_WEBHOOK_URL=https://your-domain.com/api/line/webhook
LINE_LIFF_ID=
```

---

## 🗄️ ขั้นตอนที่ 4: Setup Database

### 4.1 สร้าง Tables
```bash
# Connect to database
psql -U hotpot_user -d hotpot_kiosk_db

# Run all SQL scripts from backend/scripts/
# - createTables.sql
# - createLineNotificationsTable.sql
# - seedData.sql (if available)
```

### 4.2 สร้าง Users
```bash
cd backend
node scripts/createUsers.js
```

---

## 🔧 ขั้นตอนที่ 5: Setup Nginx

### 5.1 Copy Configuration
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/hotpot-kiosk
```

### 5.2 แก้ไข Configuration
```bash
sudo nano /etc/nginx/sites-available/hotpot-kiosk
```

แก้ไข:
- `your-domain.com` → Domain จริงของคุณ
- `/path/to/frontend/dist` → Path จริงของ Frontend dist folder
- SSL certificate paths

### 5.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/hotpot-kiosk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 ขั้นตอนที่ 6: Setup SSL Certificate

### 6.1 Get Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 6.2 Auto Renewal
```bash
sudo certbot renew --dry-run
```

---

## 🚀 ขั้นตอนที่ 7: รัน Backend ด้วย PM2

### 7.1 Setup PM2
```bash
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7.2 ตรวจสอบ Status
```bash
pm2 status
pm2 logs hotpot-backend
```

---

## ✅ ขั้นตอนที่ 8: ทดสอบ

### 8.1 ทดสอบ Frontend
- เปิด Browser ไปที่ `https://your-domain.com`
- ควรเห็นหน้า Login

### 8.2 ทดสอบ Backend API
```bash
curl https://your-domain.com/api/health
```

### 8.3 ทดสอบ LINE Notification
- สร้างออเดอร์ใหม่
- สแกน QR Code
- ทดสอบการส่งแจ้งเตือน

---

## 🔍 Troubleshooting

### Error: Cannot connect to database
- ตรวจสอบ PostgreSQL กำลังรัน: `sudo systemctl status postgresql`
- ตรวจสอบ credentials ใน `.env`
- ตรวจสอบ Firewall rules

### Error: 502 Bad Gateway
- ตรวจสอบ Backend กำลังรัน: `pm2 status`
- ตรวจสอบ Backend logs: `pm2 logs hotpot-backend`
- ตรวจสอบ Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Error: SSL Certificate
- ตรวจสอบ Certificate: `sudo certbot certificates`
- Renew Certificate: `sudo certbot renew`

### QR Code ไม่แสดง
- ตรวจสอบ `LINE_BASE_URL` ใน Backend `.env`
- ตรวจสอบ Backend logs
- ตรวจสอบ Browser Console (F12)

---

## 📝 Checklist

### Server Setup
- [ ] ติดตั้ง Node.js, PostgreSQL, Nginx, PM2
- [ ] สร้าง Database และ User
- [ ] Clone/Upload Code

### Configuration
- [ ] สร้าง Frontend `.env.production`
- [ ] สร้าง Backend `.env`
- [ ] ตั้งค่า Database credentials
- [ ] ตั้งค่า LINE API credentials

### Database
- [ ] สร้าง Tables
- [ ] Insert Seed Data
- [ ] สร้าง Users

### Deployment
- [ ] Build Frontend
- [ ] Build Backend
- [ ] Setup Nginx
- [ ] Setup SSL Certificate
- [ ] รัน Backend ด้วย PM2

### Testing
- [ ] ทดสอบ Frontend
- [ ] ทดสอบ Backend API
- [ ] ทดสอบ LINE Notification

---

## 🔄 Update Process

### เมื่อต้องการอัพเดท Code:
```bash
# Pull latest code
git pull

# Install new dependencies (if any)
npm install
cd backend && npm install

# Rebuild
npm run build
cd backend && npm run build

# Restart Backend
pm2 restart hotpot-backend

# Nginx will serve new Frontend files automatically
```

---

## 📚 เอกสารเพิ่มเติม

- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [LINE Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)

---

## 🆘 Support

หากมีปัญหา:
1. ตรวจสอบ Logs:
   - Backend: `pm2 logs hotpot-backend`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
   - PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*.log`
2. ตรวจสอบ Status:
   - Backend: `pm2 status`
   - Nginx: `sudo systemctl status nginx`
   - PostgreSQL: `sudo systemctl status postgresql`

