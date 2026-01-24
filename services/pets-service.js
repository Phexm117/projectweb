// ===== Pets service =====

function formatAge(row) {
  if (row.age_text) return row.age_text;
  const year = typeof row.age_year === 'number' ? row.age_year : 0;
  const month = typeof row.age_month === 'number' ? row.age_month : 0;
  if (year === 0 && month === 0) return '0Y';
  return `${year}Y ${month}M`;
}

async function fetchPetsForUser(dbPromise, filters = {}) {
  const where = ["post_status = 'open'"];
  const params = [];

  if (filters.pet_id) {
    where.push('pet_id LIKE ?');
    params.push(`%${filters.pet_id}%`);
  }

  if (filters.name) {
    where.push('name LIKE ?');
    params.push(`%${filters.name}%`);
  }

  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }

  if (filters.gender) {
    if (filters.gender === 'male') {
      where.push("gender IN ('male', '♂')");
    } else if (filters.gender === 'female') {
      where.push("gender IN ('female', '♀')");
    } else {
      where.push('gender = ?');
      params.push(filters.gender);
    }
  }

  if (filters.age) {
    if (filters.age === '0-1') {
      where.push('age_year BETWEEN 0 AND 1');
    } else if (filters.age === '1-3') {
      where.push('age_year BETWEEN 1 AND 3');
    } else if (filters.age === '3-5') {
      where.push('age_year BETWEEN 3 AND 5');
    } else if (filters.age === '5+') {
      where.push('age_year >= 5');
    }
  }

  if (filters.sterilized) {
    where.push('sterilized = ?');
    params.push(filters.sterilized);
  }

  if (filters.adoption_status) {
    where.push('adoption_status = ?');
    params.push(filters.adoption_status);
  }

  if (filters.color) {
    where.push('color = ?');
    params.push(filters.color);
  }

  const sql = `SELECT id, pet_id, name, gender, age_year, age_month, age_text, type, image, vaccinated, sterilized, view_count
               FROM pets
               WHERE ${where.join(' AND ')}
               ORDER BY id`;
  const [rows] = await dbPromise.query(sql, params);
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

async function fetchPetsForAdmin(dbPromise, filters = {}) {
  const where = [];
  const params = [];

  if (filters.pet_id) {
    where.push('pet_id LIKE ?');
    params.push(`%${filters.pet_id}%`);
  }

  if (filters.name) {
    where.push('name LIKE ?');
    params.push(`%${filters.name}%`);
  }

  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }

  if (filters.gender) {
    if (filters.gender === 'male') {
      where.push("gender IN ('male', '♂')");
    } else if (filters.gender === 'female') {
      where.push("gender IN ('female', '♀')");
    } else {
      where.push('gender = ?');
      params.push(filters.gender);
    }
  }

  if (filters.age) {
    if (filters.age === '0-1') {
      where.push('age_year BETWEEN 0 AND 1');
    } else if (filters.age === '1-3') {
      where.push('age_year BETWEEN 1 AND 3');
    } else if (filters.age === '3-5') {
      where.push('age_year BETWEEN 3 AND 5');
    } else if (filters.age === '5+') {
      where.push('age_year >= 5');
    }
  }

  if (filters.sterilized) {
    where.push('sterilized = ?');
    params.push(filters.sterilized);
  }

  if (filters.adoption_status) {
    where.push('adoption_status = ?');
    params.push(filters.adoption_status);
  }

  if (filters.post_status) {
    where.push('post_status = ?');
    params.push(filters.post_status);
  }

  if (filters.color) {
    where.push('color = ?');
    params.push(filters.color);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await dbPromise.query(
    `SELECT id, pet_id, name, gender, age_year, age_month, age_text, type, image, adoption_status, vaccinated, created_at, post_status FROM pets ${whereSql} ORDER BY id`,
    params
  );
  return rows.map(row => ({
    id: row.id.toString(),
    petId: row.pet_id,
    name: row.name,
    gender: row.gender,
    age: formatAge(row),
    type: row.type,
    image: row.image || '/cat.jpg',
    adoptionStatus: row.adoption_status,
    vaccinated: row.vaccinated,
    createdAt: row.created_at,
    postStatus: row.post_status
  }));
}

async function fetchPetById(dbPromise, petId) {
  const rawId = Array.isArray(petId) ? petId[0] : petId;
  const numericId = Number.parseInt(rawId, 10);
  if (!Number.isFinite(numericId)) return null;
  const [rows] = await dbPromise.query(
    'SELECT `id`, `pet_id`, `name`, `gender`, `age_year`, `age_month`, `age_text`, `type`, `image`, `image_2`, `image_3`, `sterilized`, `post_status`, `adoption_status`, `vaccinated`, `color`, `details`, `view_count` FROM `pets` WHERE `id` = ? LIMIT 1',
    [numericId]
  );
  const row = rows && rows[0];
  if (!row) return null;
  return {
    id: row.id.toString(),
    petId: row.pet_id,
    name: row.name,
    gender: row.gender,
    age: formatAge(row),
    ageYear: row.age_year,
    ageMonth: row.age_month,
    ageText: row.age_text,
    type: row.type,
    image: row.image || '/cat.jpg',
    image2: row.image_2,
    image3: row.image_3,
    sterilized: row.sterilized,
    postStatus: row.post_status,
    adoptionStatus: row.adoption_status,
    vaccinated: row.vaccinated,
    color: row.color,
    details: row.details,
    viewCount: row.view_count || 0
  };
}

async function incrementPetView(dbPromise, petId) {
  const rawId = Array.isArray(petId) ? petId[0] : petId;
  const numericId = Number.parseInt(rawId, 10);
  if (!Number.isFinite(numericId)) return null;
  await dbPromise.query(
    'UPDATE pets SET view_count = view_count + 1 WHERE id = ? LIMIT 1',
    [numericId]
  );
  return numericId;
}

async function addPet(dbPromise, payload) {
  const { body, files } = payload;
  const image1 = files?.image1?.[0] ? `/uploads/${files.image1[0].filename}` : '/cat.jpg';
  const image2 = files?.image2?.[0] ? `/uploads/${files.image2[0].filename}` : null;
  const image3 = files?.image3?.[0] ? `/uploads/${files.image3[0].filename}` : null;
  const ageYear = Number(body.age_year) || 0;
  const ageMonth = Number(body.age_month) || 0;
  const sterilized = body.sterilized || 'no';
  const postStatus = body.post_status || 'open';
  const adoptionStatus = body.adoption_status || 'available';
  const vaccinated = body.vaccinated || 'no';
  const providedPetId = body.pet_id || null;

  const [insertResult] = await dbPromise.query(
    `INSERT INTO pets
     (pet_id, name, type, gender, age_year, age_month, age_text, sterilized, post_status, adoption_status, vaccinated, color, details, image, image_2, image_3, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      providedPetId,
      body.name,
      body.type,
      body.gender,
      ageYear,
      ageMonth,
      body.age_text || null,
      sterilized,
      postStatus,
      adoptionStatus,
      vaccinated,
      body.color || null,
      body.details || null,
      image1,
      image2,
      image3,
      new Date()
    ]
  );

  // สร้างรหัสอัตโนมัติแบบ 001, 002, 003
  if (!providedPetId && insertResult && insertResult.insertId) {
    const generatedPetId = String(insertResult.insertId).padStart(3, '0');
    await dbPromise.query(
      'UPDATE pets SET pet_id = ? WHERE id = ? LIMIT 1',
      [generatedPetId, insertResult.insertId]
    );
  }

  return {
    id: insertResult?.insertId || null,
    name: body.name,
    type: body.type,
    ageYear,
    ageMonth,
    sterilized,
    vaccinated
  };
}

async function updatePet(dbPromise, payload) {
  const { body, files } = payload;
  const rawId = Array.isArray(body.id) ? body.id[0] : body.id;
  const numericId = Number.parseInt(rawId, 10);
  if (!Number.isFinite(numericId)) return null;

  const existing = await fetchPetById(dbPromise, body.id);
  const image1 = files?.image1?.[0] ? `/uploads/${files.image1[0].filename}` : (existing?.image || '/cat.jpg');
  const image2 = files?.image2?.[0] ? `/uploads/${files.image2[0].filename}` : (existing?.image2 || null);
  const image3 = files?.image3?.[0] ? `/uploads/${files.image3[0].filename}` : (existing?.image3 || null);
  const ageYear = Number(body.age_year) || 0;
  const ageMonth = Number(body.age_month) || 0;
  const sterilized = body.sterilized || 'no';
  const postStatus = body.post_status || 'open';
  const adoptionStatus = body.adoption_status || 'available';
  const vaccinated = body.vaccinated || 'no';

  await dbPromise.query(
    `UPDATE 
      \`pets\` SET
      \`pet_id\` = ?,
      \`name\` = ?,
      \`type\` = ?,
      \`gender\` = ?,
      \`age_year\` = ?,
      \`age_month\` = ?,
      \`age_text\` = ?,
      \`sterilized\` = ?,
      \`post_status\` = ?,
      \`adoption_status\` = ?,
      \`vaccinated\` = ?,
      \`color\` = ?,
      \`details\` = ?,
      \`image\` = ?,
      \`image_2\` = ?,
      \`image_3\` = ?
     WHERE \`id\` = ?`,
    [
      body.pet_id || existing?.petId || null,
      body.name,
      body.type,
      body.gender,
      ageYear,
      ageMonth,
      body.age_text || null,
      sterilized,
      postStatus,
      adoptionStatus,
      vaccinated,
      body.color || null,
      body.details || null,
      image1,
      image2,
      image3,
      numericId
    ]
  );
  return {
    id: numericId,
    petId: body.pet_id || existing?.petId || null,
    name: body.name,
    previousAdoptionStatus: existing?.adoptionStatus || null,
    nextAdoptionStatus: adoptionStatus
  };
}

async function deletePetAndArchive(dbPromise, petId) {
  const [rows] = await dbPromise.query(
    'SELECT pet_id, name, type, gender, age_year, age_month, age_text, sterilized, post_status, adoption_status, vaccinated, color, details, image, image_2, image_3, created_at FROM pets WHERE id = ? LIMIT 1',
    [petId]
  );
  const pet = rows && rows[0];
  if (pet) {
    await dbPromise.query(
      `INSERT INTO \`delete\`
       (pet_id, name, type, gender, age_year, age_month, age_text, sterilized, post_status, adoption_status, vaccinated, color, details, image, image_2, image_3, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pet.pet_id,
        pet.name,
        pet.type,
        pet.gender,
        pet.age_year,
        pet.age_month,
        pet.age_text,
        pet.sterilized,
        pet.post_status,
        pet.adoption_status,
        pet.vaccinated,
        pet.color,
        pet.details,
        pet.image,
        pet.image_2,
        pet.image_3,
        pet.created_at
      ]
    );
  }
  await dbPromise.query('DELETE FROM pets WHERE id = ?', [petId]);
}

async function togglePostStatus(dbPromise, id, nextStatus) {
  const status = nextStatus === 'close' ? 'close' : 'open';
  await dbPromise.query(
    'UPDATE pets SET post_status = ? WHERE id = ? LIMIT 1',
    [status, id]
  );
}

module.exports = {
  formatAge,
  fetchPetsForUser,
  fetchPetsForAdmin,
  fetchPetById,
  incrementPetView,
  addPet,
  updatePet,
  deletePetAndArchive,
  togglePostStatus
};
