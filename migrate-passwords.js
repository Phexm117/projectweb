// สคริปต์สำหรับแปลงรหัสผ่านที่มีอยู่เป็น bcrypt hash
// รันด้วยคำสั่ง: node migrate-passwords.js

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const SALT_ROUNDS = 10;

async function migratePasswords() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'projectweb'
    });

    console.log('Connected to database...');

    // ดึง users ทั้งหมดที่มีรหัสผ่าน plain text
    const [users] = await connection.query('SELECT id, email, password FROM users');
    
    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      // ตรวจสอบว่ารหัสผ่านเป็น hash อยู่แล้วหรือไม่ (bcrypt hash ขึ้นต้นด้วย $2b$)
      if (user.password.startsWith('$2b$')) {
        console.log(`User ${user.email}: Already hashed, skipping...`);
        continue;
      }

      // แปลงรหัสผ่าน plain text เป็น hash
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      // อัพเดทในฐานข้อมูล
      await connection.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`User ${user.email}: Password hashed successfully`);
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migratePasswords();
