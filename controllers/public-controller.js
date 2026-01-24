// ===== Public controller =====

function createPublicController() {
  return {
    landing(req, res) {
      res.render('user/landing');
    }
  };
}

module.exports = {
  createPublicController
};
