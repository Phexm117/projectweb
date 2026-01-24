// ===== Pets routes (legacy) =====
const express = require('express');
const router = express.Router();
const { ensureRole } = require('../middleware/auth');
const { dbPromise } = require('../db/mysql');

// Add pet page (legacy)
router.get('/add', (req, res) => res.render('add-pet'));

// Add pet submit (legacy)
router.post('/add', async (req, res) => {
  try {
    const petId = req.body.petId || null;
    const name = req.body.petName || req.body.name;
    const type = req.body.petType || req.body.type;
    const gender = req.body.petGender || req.body.gender;
    const ageYear = Number(req.body.petAgeYear) || 0;
    const ageMonth = Number(req.body.petAgeMonth) || 0;
    const sterilized = req.body.sterilized || 'no';
    const postStatus = req.body.postStatus || 'open';
    const color = req.body.petColor || null;
    const details = req.body.petDetail || req.body.details || null;
    const ageText = req.body.age || null;

    await dbPromise.query(
      `INSERT INTO pets
       (pet_id, name, type, gender, age_year, age_month, age_text, sterilized, post_status, color, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      , [petId, name, type, gender, ageYear, ageMonth, ageText, sterilized, postStatus, color, details]
    );
    res.redirect('/pets');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// หน้า user — เฉพาะผู้ใช้ role='user' เท่านั้น (admin จะถูกบล็อก)
router.get('/', ensureRole('user'), async (req, res) => {
  const [rows] = await dbPromise.query(
    "SELECT id, pet_id, name, type, gender, age_year, age_month, sterilized, post_status, color, details, created_at FROM pets WHERE post_status = 'open' ORDER BY created_at DESC"
  );
  const pets = rows.map(row => ({
    id: row.id,
    petId: row.pet_id,
    name: row.name,
    type: row.type,
    gender: row.gender,
    ageYear: row.age_year,
    ageMonth: row.age_month,
    sterilized: row.sterilized,
    postStatus: row.post_status,
    color: row.color,
    details: row.details,
    createdAt: row.created_at
  }));
  res.render('pets-list', { pets });
});

// หน้าสำหรับ admin (ตัวอย่าง) — เฉพาะ role='admin'
router.get('/all', ensureRole('admin'), async (req, res) => {
  const [rows] = await dbPromise.query(
    'SELECT id, pet_id, name, type, gender, age_year, age_month, sterilized, post_status, color, details, created_at FROM pets ORDER BY created_at DESC'
  );
  const pets = rows.map(row => ({
    id: row.id,
    petId: row.pet_id,
    name: row.name,
    type: row.type,
    gender: row.gender,
    ageYear: row.age_year,
    ageMonth: row.age_month,
    sterilized: row.sterilized,
    postStatus: row.post_status,
    color: row.color,
    details: row.details,
    createdAt: row.created_at
  }));
  res.render('pets-list', { pets });
});

// update example: edit and save -> redirect ให้หน้าใหม่โหลดข้อมูลจาก DB
router.post('/:id/edit', async (req, res) => {
  await dbPromise.query(
    `UPDATE pets SET
      name = ?,
      type = ?,
      gender = ?,
      age_year = ?,
      age_month = ?,
      sterilized = ?,
      post_status = ?,
      color = ?,
      details = ?
     WHERE id = ?`,
    [
      req.body.petName || req.body.name,
      req.body.petType || req.body.type,
      req.body.petGender || req.body.gender,
      Number(req.body.petAgeYear) || 0,
      Number(req.body.petAgeMonth) || 0,
      req.body.sterilized || 'no',
      req.body.postStatus || 'open',
      req.body.petColor || null,
      req.body.petDetail || req.body.details || null,
      req.params.id
    ]
  );
  res.redirect(req.body.redirectTo || '/pets');
});

module.exports = router;