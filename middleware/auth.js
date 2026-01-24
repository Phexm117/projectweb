// ===== Auth helpers (legacy) =====
const getUser = (req) => req.user || (req.session && req.session.user);

// ต้อง login ก่อนเข้า
exports.ensureAuthenticated = (req, res, next) => {
  if (getUser(req)) return next();
  return res.redirect('/login');
};

// ตรวจสอบ role
exports.ensureRole = (role) => (req, res, next) => {
  const user = getUser(req);
  if (!user) return res.redirect('/login');
  if (user.role === role) return next();
  return res.status(403).render('403', { message: 'Forbidden' });
};

// ===== Auth middleware (cookie session) =====
function createAuthMiddleware({ dbPromise, sessions }) {
  async function requireLogin(req, res, next) {
    if (!req.cookies || !req.cookies.sessionId) {
      return res.redirect('/login');
    }
    const sessionId = req.cookies.sessionId;
    let session = sessions[sessionId];
    if (!session) {
      try {
        const [rows] = await dbPromise.query(
          'SELECT user_id, name, role FROM user_sessions WHERE session_id = ? LIMIT 1',
          [sessionId]
        );
        const row = rows && rows[0];
        if (row) {
          session = { user: { id: row.user_id, name: row.name, role: row.role } };
          sessions[sessionId] = session;
        }
      } catch (err) {
        console.error('Session lookup error:', err.message);
      }
    }
    if (!session) {
      return res.redirect('/login');
    }
    req.user = session.user;
    next();
  }

  function requireRole(role) {
    return (req, res, next) => {
      return requireLogin(req, res, () => {
        if (req.user?.role === role) return next();
        if (role === 'admin') return res.redirect('/home');
        return res.redirect('/admin');
      });
    };
  }

  return {
    requireLogin,
    requireRole,
    requireAdmin: requireRole('admin'),
    requireUser: requireRole('user')
  };
}

exports.createAuthMiddleware = createAuthMiddleware;