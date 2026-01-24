// ===== Notifications service =====

async function createNotification(dbPromise, { userId, petId, type, message }) {
  await dbPromise.query(
    `INSERT INTO notifications (user_id, pet_id, type, message, is_read, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [userId, petId || null, type, message]
  );
}

async function fetchNotifications(dbPromise, userId, limit = 50) {
  const [rows] = await dbPromise.query(
    `SELECT id, user_id, pet_id, type, message, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    petId: row.pet_id,
    type: row.type,
    message: row.message,
    isRead: row.is_read === 1,
    createdAt: row.created_at
  }));
}

async function getUnreadCount(dbPromise, userId) {
  const [rows] = await dbPromise.query(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return rows?.[0]?.total || 0;
}

async function markRead(dbPromise, userId, notificationId) {
  await dbPromise.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? LIMIT 1',
    [notificationId, userId]
  );
}

async function notifyFavoritesAdopted(dbPromise, petId, petName) {
  const [rows] = await dbPromise.query(
    'SELECT DISTINCT user_id FROM favorites WHERE pet_id = ?',
    [petId]
  );
  for (const row of rows) {
    await createNotification(dbPromise, {
      userId: row.user_id,
      petId,
      type: 'favorite_adopted',
      message: `🔔 ${petName} ถูกรับเลี้ยงแล้ว`
    });
  }
}

async function notifyNewPetMatches(dbPromise, pet) {
  if (!pet?.type) return;
  const [rows] = await dbPromise.query(
    `SELECT DISTINCT f.user_id
     FROM favorites f
     JOIN pets p ON p.id = f.pet_id
     WHERE p.type = ?`,
    [pet.type]
  );
  for (const row of rows) {
    await createNotification(dbPromise, {
      userId: row.user_id,
      petId: pet.id,
      type: 'new_pet_match',
      message: `🔔 มีสัตว์ใหม่ตรงกับความสนใจ: ${pet.name}`
    });
  }
}

module.exports = {
  createNotification,
  fetchNotifications,
  getUnreadCount,
  markRead,
  notifyFavoritesAdopted,
  notifyNewPetMatches
};
