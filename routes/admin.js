const express = require('express');
const router = express.Router();
const { ensureRole } = require('../middleware/auth');

router.get('/dashboard', ensureRole('admin'), (req, res) => {
  res.render('admin-dashboard');
});

module.exports = router;