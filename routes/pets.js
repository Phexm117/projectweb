const express = require('express');
const router = express.Router();
const Pet = require('../models/pet');
const { ensureRole } = require('../middleware/auth');

router.get('/add', (req, res) => res.render('add-pet'));

router.post('/add', async (req, res) => {
    try {
        const pet = {
            petId: req.body.petId,
            name: req.body.petName,
            type: req.body.petType,
            gender: req.body.petGender,
            ageYear: Number(req.body.petAgeYear) || 0,
            ageMonth: Number(req.body.petAgeMonth) || 0,
            sterilized: req.body.sterilized,
            postStatus: req.body.postStatus,
            color: req.body.petColor,
            details: req.body.petDetail
        };
        await Pet.create(pet);
        res.redirect('/pets');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// หน้า user — เฉพาะผู้ใช้ role='user' เท่านั้น (admin จะถูกบล็อก)
router.get('/', ensureRole('user'), async (req, res) => {
  const pets = await Pet.find({ postStatus: 'open' }).sort({ createdAt: -1 });
  res.render('pets-list', { pets });
});

// หน้าสำหรับ admin (ตัวอย่าง) — เฉพาะ role='admin'
router.get('/all', ensureRole('admin'), async (req, res) => {
  const pets = await Pet.find().sort({ createdAt: -1 });
  res.render('pets-list', { pets });
});

// update example: edit and save -> redirect ให้หน้าใหม่โหลดข้อมูลจาก DB
router.post('/:id/edit', async (req, res) => {
  await Pet.findByIdAndUpdate(req.params.id, {
    name: req.body.petName,
    type: req.body.petType,
    gender: req.body.petGender,
    ageYear: Number(req.body.petAgeYear)||0,
    ageMonth: Number(req.body.petAgeMonth)||0,
    sterilized: req.body.sterilized,
    postStatus: req.body.postStatus,
    color: req.body.petColor,
    details: req.body.petDetail
  });
  res.redirect(req.body.redirectTo || '/pets');
});

module.exports = router;