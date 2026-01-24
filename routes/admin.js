// ===== Admin routes (legacy) =====
const express = require('express');
const router = express.Router();
const { ensureRole } = require('../middleware/auth');

// Admin dashboard (example)
router.get('/dashboard', ensureRole('admin'), (req, res) => {
  res.render('admin-dashboard');
});

module.exports = router;