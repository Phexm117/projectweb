const express = require('express');
const router = express.Router();

const users = [];
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  users.push({
    id: 1,
    name: process.env.ADMIN_NAME || 'admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin'
  });
}
const userEmail = process.env.USER_EMAIL;
const userPassword = process.env.USER_PASSWORD;
if (userEmail && userPassword) {
  users.push({
    id: 2,
    name: process.env.USER_NAME || 'user',
    email: userEmail,
    password: userPassword,
    role: 'user'
  });
}

router.get('/login', (req, res) => res.render('login', { error: null }));

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (users.length === 0) {
    return res.render('login', { error: 'ยังไม่ได้ตั้งค่าบัญชีผู้ใช้ในระบบ' });
  }
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.render('login', { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

  req.session.user = { id: user.id, name: user.name, role: user.role };

  if (user.role === 'admin') return res.redirect('/admin/dashboard');
  return res.redirect('/user/home');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;