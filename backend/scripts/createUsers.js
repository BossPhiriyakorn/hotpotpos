// backend/scripts/createUsers.js
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hotpot_kiosk_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

async function createUsers() {
  try {
    console.log('🔐 กำลัง hash รหัสผ่าน...');
    
    // Hash passwords (ใช้ bcrypt)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    console.log('👤 กำลังสร้าง users...');
    
    // Insert users (แค่ 2 users ตามดีไซด์)
    // 1. admin → สำหรับ CMS
    // 2. user → สำหรับ Standard User (เลือกได้ว่าจะใช้ Kiosk, Kitchen, หรือ Queue)
    const result = await pool.query(`
      INSERT INTO users (username, password_hash, user_type, is_active)
      VALUES 
        ('admin', $1, 'admin', true),
        ('user', $2, 'kiosk', true)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, user_type
    `, [adminPassword, userPassword]);

    if (result.rows.length > 0) {
      console.log('✅ สร้าง users สำเร็จ!');
      result.rows.forEach(user => {
        console.log(`   - ${user.username} (${user.user_type})`);
      });
    } else {
      console.log('ℹ️  Users มีอยู่แล้ว (ข้าม)');
    }

    // Check existing users
    const checkResult = await pool.query(`
      SELECT id, username, user_type, is_active 
      FROM users 
      ORDER BY id
    `);

    console.log('\n📋 รหัสผ่านสำหรับเข้าใช้งาน:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Admin User (สำหรับ CMS):');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Type: admin (สิทธิ์เต็ม - จัดการทุกอย่าง)');
    console.log('   → เข้าไปแล้วไปที่ AdminScreen (CMS)');
    console.log('\n🔑 Standard User (สำหรับ Kiosk/Kitchen/Queue):');
    console.log('   Username: user');
    console.log('   Password: user123');
    console.log('   Type: kiosk (Standard User)');
    console.log('   → เข้าไปแล้วเลือกได้ว่าจะใช้ Kiosk, Kitchen, หรือ Queue');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📊 Users ในระบบ:');
    if (checkResult.rows.length > 0) {
      checkResult.rows.forEach(user => {
        console.log(`   ✓ ${user.username} (${user.user_type}) - ${user.is_active ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log('   (ยังไม่มี users)');
    }
    
    console.log('\n⚠️  หมายเหตุ: เปลี่ยนรหัสผ่านเมื่อใช้งานจริง!');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    if (error.code === '42P01') {
      console.error('   → ตาราง "users" ไม่พบ กรุณาสร้างตารางก่อน');
    } else if (error.code === '23505') {
      console.error('   → Username ซ้ำ (users มีอยู่แล้ว)');
    } else if (error.code === '42501') {
      console.error('   → Permission denied!');
      console.error('   → กรุณา Grant permission ใน pgAdmin:');
      console.error('      GRANT SELECT, INSERT, UPDATE, DELETE ON users TO ' + (process.env.DB_USER || 'postgres') + ';');
      console.error('      GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO ' + (process.env.DB_USER || 'postgres') + ';');
      console.error('   → หรือใช้ postgres user ชั่วคราว (แก้ไข DB_USER ใน .env)');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createUsers();

