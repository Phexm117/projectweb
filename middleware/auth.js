const getUser = (req) => req.user || (req.session && req.session.user);

exports.ensureAuthenticated = (req, res, next) => {
  if (getUser(req)) return next();
  return res.redirect('/login');
};

exports.ensureRole = (role) => (req, res, next) => {
  const user = getUser(req);
  if (!user) return res.redirect('/login');
  if (user.role === role) return next();
  return res.status(403).render('403', { message: 'Forbidden' });
};