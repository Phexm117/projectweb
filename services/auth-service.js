// ===== Auth service =====

async function findUserByEmail(dbPromise, email) {
  const [rows] = await dbPromise.query(
    'SELECT id, name, role, password FROM users WHERE email = ? LIMIT 1',
    [email]
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

module.exports = {
  findUserByEmail,
  createUser,
  updatePasswordByEmail
};
