// ===== User controller =====

const { fetchPetsForUser, fetchPetById, incrementPetView } = require('../services/pets-service');
const { fetchFavoriteIds, fetchFavoritePets, toggleFavorite } = require('../services/user-service');
const { findUserByEmail, createUser, updatePasswordByEmail } = require('../services/auth-service');
const { fetchNotifications, getUnreadCount, markRead } = require('../services/notifications-service');

function createUserController({ dbPromise, viewCounts, searchProfiles }) {
  function normalizeSearch(query = {}) {
    const normalized = {
      type: query.type || null,
      age: query.age || null,
      sterilized: query.sterilized || null,
      vaccinated: query.vaccinated || null
    };
    return normalized;
  }

  function ageRangeFromFilter(ageFilter) {
    if (!ageFilter) return null;
    if (ageFilter === '0-1') return { min: 0, max: 1 };
    if (ageFilter === '1-3') return { min: 1, max: 3 };
    if (ageFilter === '3-5') return { min: 3, max: 5 };
    if (ageFilter === '5+') return { min: 5, max: Infinity };
    return null;
  }

  function ageInRange(pet, range) {
    if (!range) return false;
    const ageYear = Number(pet.ageYear) || 0;
    const ageMonth = Number(pet.ageMonth) || 0;
    const age = ageYear + (ageMonth / 12);
    return age >= range.min && age <= range.max;
  }

  function pickMostCommon(items) {
    const counts = new Map();
    items.forEach(item => {
      if (!item) return;
      counts.set(item, (counts.get(item) || 0) + 1);
    });
    let top = null;
    let topCount = 0;
    counts.forEach((count, key) => {
      if (count > topCount) {
        top = key;
        topCount = count;
      }
    });
    return top;
  }

  function scorePet(pet, preferences) {
    let score = 0;

    if (preferences.type && pet.type === preferences.type) {
      score += 3; // ตรงประเภทสัตว์ +3
    }

    if (preferences.ageRange && ageInRange(pet, preferences.ageRange)) {
      score += 2; // อายุใกล้เคียง +2
    }

    if (preferences.sterilized && pet.sterilized === preferences.sterilized) {
      score += 2; // สุขภาพตรงความต้องการ +2 (ใช้ค่าทำหมันแทน)
    }

    if (preferences.vaccinated && pet.vaccinated === preferences.vaccinated) {
      score += 2; // วัคซีนตรงความต้องการ +2
    }

    if (preferences.favoriteIds && preferences.favoriteIds.has(pet.id)) {
      score += 3; // อยู่ในรายการโปรด +3
    }

    return score;
  }
  return {
    async home(req, res) {
      const pets = await fetchPetsForUser(dbPromise, req.query || {});
      const favoriteIds = await fetchFavoriteIds(dbPromise, req.user.id);
      const hasFilters = req.query && Object.keys(req.query).some(key => req.query[key]);
      if (hasFilters) {
        searchProfiles[req.user.id] = {
          lastSearch: normalizeSearch(req.query)
        };
      }
      res.render('user/user_home', { user: req.user, pets: pets, filters: req.query || {}, favoriteIds });
    },
    async recommended(req, res) {
      const pets = await fetchPetsForUser(dbPromise);
      const favoriteIds = await fetchFavoriteIds(dbPromise, req.user.id);
      const favoritePets = await fetchFavoritePets(dbPromise, req.user.id);

      const lastSearch = searchProfiles[req.user.id]?.lastSearch || {};
      const preferredType = lastSearch.type || pickMostCommon(favoritePets.map(pet => pet.type));
      const preferredAgeRange = ageRangeFromFilter(lastSearch.age);
      const preferredSterilized = lastSearch.sterilized || pickMostCommon(favoritePets.map(pet => pet.sterilized));
      const preferredVaccinated = lastSearch.vaccinated || pickMostCommon(favoritePets.map(pet => pet.vaccinated));

      const preferences = {
        type: preferredType,
        ageRange: preferredAgeRange,
        sterilized: preferredSterilized,
        vaccinated: preferredVaccinated,
        favoriteIds: new Set(favoriteIds)
      };

      const scoredPets = pets.map(pet => ({
        pet,
        score: scorePet(pet, preferences)
      }));

      scoredPets.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.pet.viewCount || 0) - (a.pet.viewCount || 0);
      });

      const sortedPets = scoredPets.map(item => item.pet);
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

      try {
        await incrementPetView(dbPromise, petId);
      } catch (err) {
        console.error('Increment view error:', err.message);
      }

      if (req.query?.notificationId) {
        try {
          await markRead(dbPromise, req.user.id, req.query.notificationId);
        } catch (err) {
          console.error('Mark read error:', err.message);
        }
      }

      const petData = await fetchPetById(dbPromise, petId) || {
        id: petId,
        name: 'Unknown',
        gender: 'N/A',
        age: 'N/A'
      };
      const favoriteIds = await fetchFavoriteIds(dbPromise, req.user.id);
      res.render('user/pet-detail', { user: req.user, petData: petData, favoriteIds });
    },
    async notificationsPage(req, res) {
      const notifications = await fetchNotifications(dbPromise, req.user.id);
      res.render('user/notifications', { user: req.user, notifications });
    },
    async notificationsStream(req, res) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let active = true;
      req.on('close', () => {
        active = false;
      });

      const send = async () => {
        if (!active) return;
        try {
          const unreadCount = await getUnreadCount(dbPromise, req.user.id);
          res.write(`data: ${JSON.stringify({ unreadCount })}\n\n`);
        } catch (err) {
          // ignore
        }
      };

      await send();
      const interval = setInterval(send, 5000);
      req.on('close', () => clearInterval(interval));
    },
    async notificationsLatest(req, res) {
      try {
        const notifications = await fetchNotifications(dbPromise, req.user.id, 20);
        return res.json({ success: true, notifications });
      } catch (err) {
        return res.status(500).json({ success: false });
      }
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
