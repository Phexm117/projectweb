// ===== User routes (legacy) =====
const express = require('express');
const router = express.Router();
const { ensureRole } = require('../middleware/auth');

// User home (example)
router.get('/home', ensureRole('user'), (req, res) => {
  res.render('user-home');
});

module.exports = router;