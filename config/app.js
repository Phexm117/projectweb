// ===== App config =====

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const UPLOAD_DIR = 'public/uploads/';

module.exports = {
  PORT,
  HOST,
  UPLOAD_DIR
};
