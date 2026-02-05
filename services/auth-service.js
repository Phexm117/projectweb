// ===== Auth service =====

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

async function findUserByEmail(dbPromise, email) {
  const [rows] = await dbPromise.query(
    'SELECT id, name, email, role, password FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows && rows[0];
}

async function findUserById(dbPromise, userId) {
  const [rows] = await dbPromise.query(
    'SELECT id, name, email, role, password FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  return rows && rows[0];
}

// Hash password ก่อนบันทึกลงฐานข้อมูล
async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// ตรวจสอบรหัสผ่านที่ user ป้อนกับ hash ในฐานข้อมูล
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

async function createUser(dbPromise, payload) {
  const { name, email, password, role = 'user' } = payload;
  const hashedPassword = await hashPassword(password);
  await dbPromise.query(
    'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashedPassword, role, new Date()]
  );
}

async function updatePasswordByEmail(dbPromise, email, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  await dbPromise.query(
    'UPDATE users SET password = ? WHERE email = ?',
    [hashedPassword, email]
  );
}

async function updatePasswordById(dbPromise, userId, newPassword) {
  const hashedPassword = await hashPassword(newPassword);
  await dbPromise.query(
    'UPDATE users SET password = ? WHERE id = ?',
    [hashedPassword, userId]
  );
}

async function updateUserProfile(dbPromise, userId, payload) {
  const { name, email } = payload;
  await dbPromise.query(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name, email, userId]
  );
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updatePasswordByEmail,
  updatePasswordById,
  updateUserProfile,
  hashPassword,
  verifyPassword
};
