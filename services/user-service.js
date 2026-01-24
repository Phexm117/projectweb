// ===== User service =====

const { formatAge } = require('./pets-service');

async function fetchFavoriteIds(dbPromise, userId) {
  const [rows] = await dbPromise.query(
    'SELECT pet_id FROM favorites WHERE user_id = ? ORDER BY favorite_id DESC',
    [userId]
  );
  return rows.map(row => row.pet_id.toString());
}

async function fetchFavoritePets(dbPromise, userId) {
  const [rows] = await dbPromise.query(
    `SELECT p.id, p.pet_id, p.name, p.gender, p.age_year, p.age_month, p.age_text, p.type, p.image, p.vaccinated, p.view_count, p.sterilized
     FROM favorites f
     JOIN pets p ON p.id = f.pet_id
     WHERE f.user_id = ? AND p.post_status = 'open'
     ORDER BY f.favorite_id DESC`,
    [userId]
  );
  return rows.map(row => ({
    id: row.id.toString(),
    petId: row.pet_id,
    name: row.name,
    gender: row.gender,
    age: formatAge(row),
    ageYear: row.age_year,
    ageMonth: row.age_month,
    type: row.type,
    image: row.image || '/cat.jpg',
    vaccinated: (row.vaccinated || 'no'),
    sterilized: row.sterilized || 'no',
    viewCount: row.view_count || 0
  }));
}

async function toggleFavorite(dbPromise, userId, petId) {
  const [rows] = await dbPromise.query(
    'SELECT favorite_id FROM favorites WHERE user_id = ? AND pet_id = ? LIMIT 1',
    [userId, petId]
  );
  if (rows && rows.length > 0) {
    await dbPromise.query(
      'DELETE FROM favorites WHERE user_id = ? AND pet_id = ? LIMIT 1',
      [userId, petId]
    );
    return { favorited: false };
  }

  await dbPromise.query(
    'INSERT INTO favorites (user_id, pet_id) VALUES (?, ?)',
    [userId, petId]
  );
  return { favorited: true };
}

module.exports = {
  fetchFavoriteIds,
  fetchFavoritePets,
  toggleFavorite
};
