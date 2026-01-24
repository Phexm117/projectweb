// ===== Auth controller =====

const { findUserByEmail } = require('../services/auth-service');

function createAuthController({ dbPromise, sessions }) {
  return {
    loginPage(req, res) {
      res.render('user/login');
    },
    async login(req, res) {
      try {
        const { email, password } = req.body;
        const user = await findUserByEmail(dbPromise, email);
        if (!user || user.password !== password) {
          return res.render('user/login', { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        const sessionId = Math.random().toString(36).substring(7);
        sessions[sessionId] = { user: { id: user.id, name: user.name, role: user.role } };
        res.cookie('sessionId', sessionId, { httpOnly: true });
        await dbPromise.query(
          `INSERT INTO user_sessions (session_id, user_id, name, role)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), name = VALUES(name), role = VALUES(role)`
          , [sessionId, user.id, user.name, user.role]
        );
        await dbPromise.query(
          'INSERT INTO login_activity (user_id, ip_address, user_agent) VALUES (?, ?, ?)',
          [user.id, req.ip || null, req.headers['user-agent'] || null]
        );
        if (user.role === 'admin') return res.redirect('/admin');
        return res.redirect('/home');
      } catch (err) {
        console.error('Login error:', err.message);
        return res.render('user/login', { error: 'ระบบมีปัญหา โปรดลองอีกครั้ง' });
      }
    },
    async logout(req, res) {
      if (req.cookies.sessionId) {
        delete sessions[req.cookies.sessionId];
        dbPromise
          .query('DELETE FROM user_sessions WHERE session_id = ?', [req.cookies.sessionId])
          .catch(err => console.error('Session delete error:', err.message));
      }
      res.clearCookie('sessionId');
      res.redirect('/login');
    }
  };
}

module.exports = {
  createAuthController
};
