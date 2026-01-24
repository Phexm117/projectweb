// ===== Admin controller =====

const {
  fetchPetsForAdmin,
  fetchPetById,
  addPet,
  updatePet,
  deletePetAndArchive,
  togglePostStatus
} = require('../services/pets-service');
const { fetchLoginActivity, changePassword } = require('../services/admin-service');

function createAdminController({ dbPromise }) {
  async function renderAdminPage(req, res, options = {}) {
    const {
      activeTab = 'pets',
      filters = {},
      settingsError = null,
      settingsSuccess = null
    } = options;
    const pets = await fetchPetsForAdmin(dbPromise, filters || {});
    const loginActivity = await fetchLoginActivity(dbPromise, req.user.id);
    return res.render('admin/admin', {
      user: req.user,
      pets,
      filters: filters || {},
      activeTab,
      loginActivity,
      settingsError,
      settingsSuccess
    });
  }

  return {
    async adminPage(req, res) {
      const activeTab = req.query?.tab || 'pets';
      return renderAdminPage(req, res, {
        activeTab,
        filters: req.query || {},
        settingsError: null,
        settingsSuccess: null
      });
    },
    async changePassword(req, res) {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      let settingsError = null;
      let settingsSuccess = null;

      if (!currentPassword || !newPassword || !confirmPassword) {
        settingsError = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      } else if (newPassword !== confirmPassword) {
        settingsError = 'รหัสผ่านใหม่ไม่ตรงกัน';
      } else {
        const result = await changePassword(dbPromise, req.user.id, currentPassword, newPassword);
        if (!result.success) {
          settingsError = result.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้';
        } else {
          settingsSuccess = 'เปลี่ยนรหัสผ่านสำเร็จ';
        }
      }

      return renderAdminPage(req, res, {
        activeTab: 'settings',
        filters: {},
        settingsError,
        settingsSuccess
      });
    },
    async togglePostStatus(req, res) {
      const { id, nextStatus, tab } = req.body;
      try {
        await togglePostStatus(dbPromise, id, nextStatus);
      } catch (err) {
        console.error('Toggle post status error:', err.message);
      }
      if (tab) return res.redirect(`/admin?tab=${tab}`);
      return res.redirect('/admin');
    },
    getAddPet(req, res) {
      res.render('admin/add-pet', { user: req.user });
    },
    async postAddPet(req, res) {
      try {
        await addPet(dbPromise, { body: req.body, files: req.files });
      } catch (err) {
        console.error('Add pet error:', err.message);
      }
      res.redirect('/admin');
    },
    async getEditPet(req, res) {
      const pet = await fetchPetById(dbPromise, req.query.id);
      if (!pet) return res.redirect('/admin');
      res.render('admin/edit-pet', { user: req.user, pet: pet });
    },
    async postEditPet(req, res) {
      try {
        const updatedId = await updatePet(dbPromise, { body: req.body, files: req.files });
        if (!updatedId) return res.redirect('/admin');
      } catch (err) {
        console.error('Update pet error:', err.message);
      }
      res.redirect('/admin');
    },
    async deletePet(req, res) {
      try {
        await deletePetAndArchive(dbPromise, req.body.id);
        return res.redirect('/admin');
      } catch (err) {
        console.error('Delete pet error:', err.message);
        return res.redirect('/admin');
      }
    }
  };
}

module.exports = {
  createAdminController
};
