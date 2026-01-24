const express = require('express');
const router = express.Router();
const { ensureRole } = require('../middleware/auth');

router.get('/home', ensureRole('user'), (req, res) => {
  res.render('user-home');
});

module.exports = router;