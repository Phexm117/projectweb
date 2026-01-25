// ===== Auth service =====

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

async function createUser(dbPromise, payload) {
  const { name, email, password, role = 'user' } = payload;
  await dbPromise.query(
    'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
    [name, email, password, role, new Date()]
  );
}

async function updatePasswordByEmail(dbPromise, email, newPassword) {
  await dbPromise.query(
    'UPDATE users SET password = ? WHERE email = ?',
    [newPassword, email]
  );
}

async function updatePasswordById(dbPromise, userId, newPassword) {
  await dbPromise.query(
    'UPDATE users SET password = ? WHERE id = ?',
    [newPassword, userId]
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
  updateUserProfile
};
