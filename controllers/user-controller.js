// ===== User controller =====

const { fetchPetsForUser, fetchPetById } = require('../services/pets-service');
const { fetchFavoriteIds, fetchFavoritePets, toggleFavorite } = require('../services/user-service');
const { findUserByEmail, createUser, updatePasswordByEmail } = require('../services/auth-service');

function createUserController({ dbPromise, viewCounts }) {
  return {
    async home(req, res) {
      const pets = await fetchPetsForUser(dbPromise, req.query || {});
      const favoriteIds = await fetchFavoriteIds(dbPromise, req.user.id);
      res.render('user/user_home', { user: req.user, pets: pets, filters: req.query || {}, favoriteIds });
    },
    async recommended(req, res) {
      const pets = await fetchPetsForUser(dbPromise);
      const userViews = viewCounts[req.user.id] || {};
      const sortedPets = [...pets].sort((a, b) => (userViews[b.id] || 0) - (userViews[a.id] || 0));
      const favoriteIds = await fetchFavoriteIds(dbPromise, req.user.id);
      res.render('user/recommended', { user: req.user, pets: sortedPets, favoriteIds });
    },
    async favorites(req, res) {
      const pets = await fetchFavoritePets(dbPromise, req.user.id);
      res.render('user/favorites', { user: req.user, pets: pets });
    },
    async petDetail(req, res) {
      const petId = req.params.id;
      if (!viewCounts[req.user.id]) viewCounts[req.user.id] = {};
      viewCounts[req.user.id][petId] = (viewCounts[req.user.id][petId] || 0) + 1;

      const petData = await fetchPetById(dbPromise, petId) || {
        id: petId,
        name: 'Unknown',
        gender: 'N/A',
        age: 'N/A'
      };
      res.render('user/pet-detail', { user: req.user, petData: petData });
    },
    signupPage(req, res) {
      res.render('user/signup');
    },
    async signup(req, res) {
      try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
          return res.render('user/signup', { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const existing = await findUserByEmail(dbPromise, email);
        if (existing) {
          return res.render('user/signup', { error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        await createUser(dbPromise, { name, email, password, role: 'user' });
        return res.redirect('/login');
      } catch (err) {
        console.error('Signup error:', err.message);
        return res.render('user/signup', { error: 'ระบบมีปัญหา โปรดลองอีกครั้ง' });
      }
    },
    forgotPasswordPage(req, res) {
      res.render('user/forgot-password');
    },
    async forgotPassword(req, res) {
      try {
        const { email, newPassword, confirmPassword } = req.body;
        if (!email || !newPassword || !confirmPassword) {
          return res.render('user/forgot-password', { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }
        if (newPassword !== confirmPassword) {
          return res.render('user/forgot-password', { error: 'รหัสผ่านไม่ตรงกัน' });
        }

        const existing = await findUserByEmail(dbPromise, email);
        if (!existing) {
          return res.render('user/forgot-password', { error: 'ไม่พบอีเมลนี้ในระบบ' });
        }

        await updatePasswordByEmail(dbPromise, email, newPassword);
        return res.render('user/forgot-password', { success: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
      } catch (err) {
        console.error('Forgot password error:', err.message);
        return res.render('user/forgot-password', { error: 'ระบบมีปัญหา โปรดลองอีกครั้ง' });
      }
    },
    async toggleFavorite(req, res) {
      const rawPetId = req.body.petId;
      const petId = Number.parseInt(rawPetId, 10);
      if (!Number.isFinite(petId)) {
        return res.status(400).json({ success: false });
      }
      try {
        const result = await toggleFavorite(dbPromise, req.user.id, petId);
        return res.json({ success: true, favorited: result.favorited });
      } catch (err) {
        console.error('Toggle favorite error:', err.message);
        return res.status(500).json({ success: false });
      }
    }
  };
}

module.exports = {
  createUserController
};
