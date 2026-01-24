// ===== Admin service =====

async function fetchLoginActivity(dbPromise, userId, limit = 20) {
  const [rows] = await dbPromise.query(
    `SELECT id, user_id, ip_address, user_agent, logged_in_at
     FROM login_activity
     WHERE user_id = ?
     ORDER BY logged_in_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    loggedInAt: row.logged_in_at
  }));
}

async function changePassword(dbPromise, userId, currentPassword, newPassword) {
  const [rows] = await dbPromise.query(
    'SELECT id, password FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  const user = rows && rows[0];
  if (!user) {
    return { success: false, error: 'ไม่พบผู้ใช้' };
  }
  if (user.password !== currentPassword) {
    return { success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' };
  }
  await dbPromise.query(
    'UPDATE users SET password = ? WHERE id = ? LIMIT 1',
    [newPassword, userId]
  );
  return { success: true };
}

module.exports = {
  fetchLoginActivity,
  changePassword
};
