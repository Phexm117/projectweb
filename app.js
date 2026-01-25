// ===== App setup =====
require('dotenv').config({ override: true });
const express = require("express");
const multer = require('multer');
const { dbPromise } = require('./db/mysql');
const { PORT, UPLOAD_DIR, HOST } = require('./config/app');
const { initMySql } = require('./config/mysql-init');
const { createAuthMiddleware } = require('./middleware/auth');
const { createPublicController } = require('./controllers/public-controller');
const { createAuthController } = require('./controllers/auth-controller');
const { createUserController } = require('./controllers/user-controller');
const { createAdminController } = require('./controllers/admin-controller');
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views"); // ระบุ path ของ views
app.use(express.static("public")); // เสิร์ฟไฟล์ static
app.use(express.urlencoded({ extended: true })); // รับ form data

const upload = multer({ dest: UPLOAD_DIR }); // อัปโหลดรูปไปยัง public/uploads
const petUploadFields = upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 }
]);

// ===== In-memory stores =====
const viewCounts = {}; // { userId: { petId: count } }
const searchProfiles = {}; // { userId: { lastSearch: {...} } }

// Simple cookie parser middleware (ไม่ใช้ cookie-parser)
app.use((req, res, next) => {
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      cookies[key] = decodeURIComponent(value);
    });
  }
  req.cookies = cookies;
  next();
});

// Session storage (in-memory)
const sessions = {};

/*
// ===== MySQL init + seed admin/user from env =====
async function initMySql() {
  try {
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS login_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        ip_address VARCHAR(255) NULL,
        user_agent TEXT NULL,
        logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_login_activity_user_id (user_id)
      )
    `);

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        favorite_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        pet_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_favorites_user_pet (user_id, pet_id)
      )
    `);

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // เติมคอลัมน์ที่ยังไม่มี (users)
    async function ensureColumn(columnName, columnDefinition) {
      const [columns] = await dbPromise.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = ?`,
        [columnName]
      );
      if (!columns || columns.length === 0) {
        await dbPromise.query(`ALTER TABLE users ADD COLUMN ${columnDefinition}`);
      }
    }

    await ensureColumn('password', "password VARCHAR(255) NOT NULL");
    await ensureColumn('name', "name VARCHAR(255) NULL");
    await ensureColumn('role', "role ENUM('user', 'admin') NOT NULL DEFAULT 'user'");
    await ensureColumn('created_at', "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS pets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id VARCHAR(50) NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        age_year INT NOT NULL DEFAULT 0,
        age_month INT NOT NULL DEFAULT 0,
        age_text VARCHAR(50) NULL,
        sterilized ENUM('yes', 'no') NOT NULL DEFAULT 'no',
        post_status ENUM('open', 'close') NOT NULL DEFAULT 'open',
        color VARCHAR(50) NULL,
        details TEXT NULL,
        image VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS \`delete\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pet_id VARCHAR(50) NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        age_year INT NOT NULL DEFAULT 0,
        age_month INT NOT NULL DEFAULT 0,
        age_text VARCHAR(50) NULL,
        sterilized ENUM('yes', 'no') NOT NULL DEFAULT 'no',
        post_status ENUM('open', 'close') NOT NULL DEFAULT 'open',
        adoption_status ENUM('available', 'unavailable', 'adopted') NOT NULL DEFAULT 'available',
        vaccinated ENUM('yes', 'no') NOT NULL DEFAULT 'no',
        color VARCHAR(50) NULL,
        details TEXT NULL,
        image VARCHAR(255) NULL,
        image_2 VARCHAR(255) NULL,
        image_3 VARCHAR(255) NULL,
        created_at TIMESTAMP NULL,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // เติมคอลัมน์ที่ยังไม่มี (pets)
    async function ensurePetColumn(columnName, columnDefinition) {
      const [columns] = await dbPromise.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'pets'
           AND COLUMN_NAME = ?`,
        [columnName]
      );
      if (!columns || columns.length === 0) {
        await dbPromise.query(`ALTER TABLE pets ADD COLUMN ${columnDefinition}`);
      }
    }

    await ensurePetColumn('pet_id', "pet_id VARCHAR(50) NULL UNIQUE");
    await ensurePetColumn('age_year', "age_year INT NOT NULL DEFAULT 0");
    await ensurePetColumn('age_month', "age_month INT NOT NULL DEFAULT 0");
    await ensurePetColumn('age_text', "age_text VARCHAR(50) NULL");
    await ensurePetColumn('sterilized', "sterilized ENUM('yes', 'no') NOT NULL DEFAULT 'no'");
    await ensurePetColumn('post_status', "post_status ENUM('open', 'close') NOT NULL DEFAULT 'open'");
    await ensurePetColumn('color', "color VARCHAR(50) NULL");
    await ensurePetColumn('details', "details TEXT NULL");
    await ensurePetColumn('image', "image VARCHAR(255) NULL");
    await ensurePetColumn('image_2', "image_2 VARCHAR(255) NULL");
    await ensurePetColumn('image_3', "image_3 VARCHAR(255) NULL");
    await ensurePetColumn('adoption_status', "adoption_status ENUM('available', 'unavailable', 'adopted') NOT NULL DEFAULT 'available'");
    await ensurePetColumn('vaccinated', "vaccinated ENUM('yes', 'no') NOT NULL DEFAULT 'no'");
    await ensurePetColumn('created_at', "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      await dbPromise.query(
        `INSERT INTO users (email, password, name, role)
         VALUES (?, ?, ?, 'admin')
         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), role = 'admin'`,
        [adminEmail, adminPassword, process.env.ADMIN_NAME || 'admin']
      );
    }

    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;
    if (userEmail && userPassword) {
      await dbPromise.query(
        `INSERT INTO users (email, password, name, role)
         VALUES (?, ?, ?, 'user')
         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), role = 'user'`,
        [userEmail, userPassword, process.env.USER_NAME || 'user']
      );
    }
  } catch (err) {
    console.error('MySQL init error:', err.message);
  }
}

initMySql();

// ===== Helpers =====
function formatAge(row) {
  if (row.age_text) return row.age_text;
  const year = typeof row.age_year === 'number' ? row.age_year : 0;
  const month = typeof row.age_month === 'number' ? row.age_month : 0;
  if (year === 0 && month === 0) return '0Y';
  return `${year}Y ${month}M`;
}

// รายการสัตว์สำหรับผู้ใช้ (เปิดโพสต์เท่านั้น)
async function fetchPetsForUser(filters = {}) {
  const where = ["post_status = 'open'"];
  const params = [];

  if (filters.pet_id) {
    where.push('pet_id LIKE ?');
    params.push(`%${filters.pet_id}%`);
  }

  if (filters.name) {
    where.push('name LIKE ?');
    params.push(`%${filters.name}%`);
  }

  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }

  if (filters.gender) {
    if (filters.gender === 'male') {
      where.push("gender IN ('male', '♂')");
    } else if (filters.gender === 'female') {
      where.push("gender IN ('female', '♀')");
    } else {
      where.push('gender = ?');
      params.push(filters.gender);
    }
  }

  if (filters.age) {
    if (filters.age === '0-1') {
      where.push('age_year BETWEEN 0 AND 1');
    } else if (filters.age === '1-3') {
      where.push('age_year BETWEEN 1 AND 3');
    } else if (filters.age === '3-5') {
      where.push('age_year BETWEEN 3 AND 5');
    } else if (filters.age === '5+') {
      where.push('age_year >= 5');
    }
  }

  if (filters.sterilized) {
    where.push('sterilized = ?');
    params.push(filters.sterilized);
  }

  if (filters.adoption_status) {
    where.push('adoption_status = ?');
    params.push(filters.adoption_status);
  }

  if (filters.color) {
    where.push('color = ?');
    params.push(filters.color);
  }

  const sql = `SELECT id, pet_id, name, gender, age_year, age_month, age_text, type, image, vaccinated
               FROM pets
               WHERE ${where.join(' AND ')}
               ORDER BY id`;
  const [rows] = await dbPromise.query(sql, params);
  return rows.map(row => ({
    id: row.id.toString(),
    petId: row.pet_id,
    name: row.name,
    gender: row.gender,
    age: formatAge(row),
    type: row.type,
    image: row.image || '/cat.jpg',
    vaccinated: (row.vaccinated || 'no')
  }));
}

// รายการสัตว์สำหรับแอดมิน (ทุกสถานะ)
async function fetchPetsForAdmin(filters = {}) {
  const where = [];
  const params = [];

  if (filters.pet_id) {
    where.push('pet_id LIKE ?');
    params.push(`%${filters.pet_id}%`);
  }

  if (filters.name) {
    where.push('name LIKE ?');
    params.push(`%${filters.name}%`);
  }

  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }

  if (filters.gender) {
    if (filters.gender === 'male') {
      where.push("gender IN ('male', '♂')");
    } else if (filters.gender === 'female') {
      where.push("gender IN ('female', '♀')");
    } else {
      where.push('gender = ?');
      params.push(filters.gender);
    }
  }

  if (filters.age) {
    if (filters.age === '0-1') {
      where.push('age_year BETWEEN 0 AND 1');
    } else if (filters.age === '1-3') {
      where.push('age_year BETWEEN 1 AND 3');
    } else if (filters.age === '3-5') {
      where.push('age_year BETWEEN 3 AND 5');
    } else if (filters.age === '5+') {
      where.push('age_year >= 5');
    }
  }

  if (filters.sterilized) {
    where.push('sterilized = ?');
    params.push(filters.sterilized);
  }

  if (filters.adoption_status) {
    where.push('adoption_status = ?');
    params.push(filters.adoption_status);
  }

  if (filters.post_status) {
    where.push('post_status = ?');
    params.push(filters.post_status);
  }

  if (filters.color) {
    where.push('color = ?');
    params.push(filters.color);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await dbPromise.query(
    `SELECT id, pet_id, name, gender, age_year, age_month, age_text, type, image, adoption_status, vaccinated, created_at, post_status FROM pets ${whereSql} ORDER BY id`,
    params
  );
  return rows.map(row => ({
    id: row.id.toString(),
    petId: row.pet_id,
    name: row.name,
    gender: row.gender,
    age: formatAge(row),
    type: row.type,
    image: row.image || '/cat.jpg',
    adoptionStatus: row.adoption_status,
    vaccinated: row.vaccinated,
    createdAt: row.created_at,
    postStatus: row.post_status
  }));
}

// รายละเอียดสัตว์ตาม id
async function fetchPetById(petId) {
  const rawId = Array.isArray(petId) ? petId[0] : petId;
  const numericId = Number.parseInt(rawId, 10);
  if (!Number.isFinite(numericId)) return null;
  const [rows] = await dbPromise.query(
    'SELECT `id`, `pet_id`, `name`, `gender`, `age_year`, `age_month`, `age_text`, `type`, `image`, `image_2`, `image_3`, `sterilized`, `post_status`, `adoption_status`, `vaccinated`, `color`, `details` FROM `pets` WHERE `id` = ? LIMIT 1',
    [numericId]
  );
  const row = rows && rows[0];
  if (!row) return null;
  return {
    id: row.id.toString(),
    petId: row.pet_id,
    name: row.name,
    gender: row.gender,
    age: formatAge(row),
    ageYear: row.age_year,
    ageMonth: row.age_month,
    ageText: row.age_text,
    type: row.type,
    image: row.image || '/cat.jpg',
    image2: row.image_2,
    image3: row.image_3,
    sterilized: row.sterilized,
    postStatus: row.post_status,
    adoptionStatus: row.adoption_status,
    vaccinated: row.vaccinated,
    color: row.color,
    details: row.details
  };
}

// ประวัติการเข้าใช้งาน
async function fetchLoginActivity(userId, limit = 20) {
  const [rows] = await dbPromise.query(
    `SELECT id, user_id, ip_address, user_agent, logged_in_at
     FROM login_activity
     WHERE user_id = ?
     ORDER BY logged_in_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    loggedInAt: row.logged_in_at
  }));
}

// รายการ favorite id ของผู้ใช้
async function fetchFavoriteIds(userId) {
  const [rows] = await dbPromise.query(
    'SELECT pet_id FROM favorites WHERE user_id = ? ORDER BY favorite_id DESC',
    [userId]
  );
  return rows.map(row => row.pet_id.toString());
}

// เรนเดอร์หน้า admin (ใช้ซ้ำหลายจุด)
async function renderAdminPage(req, res, options = {}) {
  const {
    activeTab = 'pets',
    filters = {},
    settingsError = null,
    settingsSuccess = null
  } = options;
  const pets = await fetchPetsForAdmin(filters || {});
  const loginActivity = await fetchLoginActivity(req.user.id);
  return res.render("admin/admin", {
    user: req.user,
    pets,
    filters: filters || {},
    activeTab,
    loginActivity,
    settingsError,
    settingsSuccess
  });
}

// รายการสัตว์โปรดของผู้ใช้
async function fetchFavoritePets(userId) {
  const [rows] = await dbPromise.query(
    `SELECT p.id, p.pet_id, p.name, p.gender, p.age_year, p.age_month, p.age_text, p.type, p.image, p.vaccinated
     FROM favorites f
     JOIN pets p ON p.id = f.pet_id
     WHERE f.user_id = ? AND p.post_status = 'open'
     ORDER BY f.favorite_id DESC`,
    [userId]
  );
  return rows.map(row => ({
    id: row.id.toString(),
    petId: row.pet_id,
    name: row.name,
    gender: row.gender,
    age: formatAge(row),
    type: row.type,
    image: row.image || '/cat.jpg',
    vaccinated: (row.vaccinated || 'no')
  }));
}

// ===== Auth middleware =====
async function requireLogin(req, res, next) {
  if (!req.cookies || !req.cookies.sessionId) {
    return res.redirect("/login");
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
    return res.redirect("/login");
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

const requireAdmin = requireRole('admin');
const requireUser = requireRole('user');

// ===== Public routes =====
app.get("/", (req, res) => {
  res.render("user/landing");
});

// ===== User routes =====
app.get("/home", requireUser, async (req, res) => {
  const pets = await fetchPetsForUser(req.query || {});
  const favoriteIds = await fetchFavoriteIds(req.user.id);
  res.render("user/user_home", { user: req.user, pets: pets, filters: req.query || {}, favoriteIds });
});

app.get("/recommended", requireUser, async (req, res) => {
  const pets = await fetchPetsForUser();
  const userViews = viewCounts[req.user.id] || {};
  const sortedPets = [...pets].sort((a, b) => (userViews[b.id] || 0) - (userViews[a.id] || 0));
  const favoriteIds = await fetchFavoriteIds(req.user.id);
  res.render("user/recommended", { user: req.user, pets: sortedPets, favoriteIds });
});

app.get("/favorites", requireUser, async (req, res) => {
  const pets = await fetchFavoritePets(req.user.id);
  res.render("user/favorites", { user: req.user, pets: pets });
});

app.get("/login", (req, res) => {
  res.render("user/login");
});

app.get("/forgot-password", (req, res) => {
  res.render("user/forgot-password");
});

app.get("/signup", (req, res) => {
  res.render("user/signup");
});

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.render("user/signup", { error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const [existingRows] = await dbPromise.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (existingRows && existingRows.length > 0) {
      return res.render("user/signup", { error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    await dbPromise.query(
      'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, 'user', new Date()]
    );

    return res.redirect("/login");
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.render("user/signup", { error: "ระบบมีปัญหา โปรดลองอีกครั้ง" });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.render("user/forgot-password", { error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }
    if (newPassword !== confirmPassword) {
      return res.render("user/forgot-password", { error: "รหัสผ่านไม่ตรงกัน" });
    }

    const [rows] = await dbPromise.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (!rows || rows.length === 0) {
      return res.render("user/forgot-password", { error: "ไม่พบอีเมลนี้ในระบบ" });
    }

    await dbPromise.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [newPassword, email]
    );

    return res.render("user/forgot-password", { success: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.render("user/forgot-password", { error: "ระบบมีปัญหา โปรดลองอีกครั้ง" });
  }
});

// ===== Admin routes =====
app.get("/admin", requireAdmin, async (req, res) => {
  const activeTab = req.query?.tab || 'pets';
  return renderAdminPage(req, res, {
    activeTab,
    filters: req.query || {},
    settingsError: null,
    settingsSuccess: null
  });
});

// Pet detail page
app.get("/pet/:id", requireUser, async (req, res) => {
  const petId = req.params.id;
  if (!viewCounts[req.user.id]) viewCounts[req.user.id] = {};
  viewCounts[req.user.id][petId] = (viewCounts[req.user.id][petId] || 0) + 1;

  const petData = await fetchPetById(petId) || {
    id: petId,
    name: "Unknown",
    gender: "N/A",
    age: "N/A"
  };
  res.render("user/pet-detail", { user: req.user, petData: petData });
});

app.get("/logout", (req, res) => {
  // Clear session
  if (req.cookies.sessionId) {
    delete sessions[req.cookies.sessionId];
    dbPromise
      .query('DELETE FROM user_sessions WHERE session_id = ?', [req.cookies.sessionId])
      .catch(err => console.error('Session delete error:', err.message));
  }
  res.clearCookie("sessionId");
  res.redirect("/login");
});

// ===== Favorites API =====
app.post("/favorites/toggle", requireUser, async (req, res) => {
  const rawPetId = req.body.petId;
  const petId = Number.parseInt(rawPetId, 10);
  if (!Number.isFinite(petId)) {
    return res.status(400).json({ success: false });
  }
  try {
    const [rows] = await dbPromise.query(
      'SELECT favorite_id FROM favorites WHERE user_id = ? AND pet_id = ? LIMIT 1',
      [req.user.id, petId]
    );
    if (rows && rows.length > 0) {
      await dbPromise.query(
        'DELETE FROM favorites WHERE user_id = ? AND pet_id = ? LIMIT 1',
        [req.user.id, petId]
      );
      return res.json({ success: true, favorited: false });
    }
    await dbPromise.query(
      'INSERT INTO favorites (user_id, pet_id) VALUES (?, ?)',
      [req.user.id, petId]
    );
    return res.json({ success: true, favorited: true });
  } catch (err) {
    console.error('Toggle favorite error:', err.message);
    return res.status(500).json({ success: false });
  }
});

// ===== Auth routes =====
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await dbPromise.query(
      'SELECT id, name, role, password FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const user = rows && rows[0];
    if (!user || user.password !== password) {
      return res.render("user/login", { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }
    const sessionId = Math.random().toString(36).substring(7);
    sessions[sessionId] = { user: { id: user.id, name: user.name, role: user.role } };
    res.cookie("sessionId", sessionId, { httpOnly: true });
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
    if (user.role === "admin") return res.redirect("/admin");
    return res.redirect("/home");
  } catch (err) {
    console.error('Login error:', err.message);
    return res.render("user/login", { error: "ระบบมีปัญหา โปรดลองอีกครั้ง" });
  }
});

// เปลี่ยนรหัสผ่านแอดมิน
app.post("/admin/change-password", requireAdmin, async (req, res) => {

  const { currentPassword, newPassword, confirmPassword } = req.body;
  let settingsError = null;
  let settingsSuccess = null;

  if (!currentPassword || !newPassword || !confirmPassword) {
    settingsError = 'กรุณากรอกข้อมูลให้ครบถ้วน';
  } else if (newPassword !== confirmPassword) {
    settingsError = 'รหัสผ่านใหม่ไม่ตรงกัน';
  } else {
    const [rows] = await dbPromise.query(
      'SELECT id, password FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    const user = rows && rows[0];
    if (!user || user.password !== currentPassword) {
      settingsError = 'รหัสผ่านเดิมไม่ถูกต้อง';
    } else {
      await dbPromise.query(
        'UPDATE users SET password = ? WHERE id = ? LIMIT 1',
        [newPassword, req.user.id]
      );
      settingsSuccess = 'เปลี่ยนรหัสผ่านสำเร็จ';
    }
  }

  const pets = await fetchPetsForAdmin({});
  return renderAdminPage(req, res, {
    activeTab: 'settings',
    filters: {},
    settingsError,
    settingsSuccess
  });
});

// สลับสถานะโพสต์ (เปิด/ปิด)
app.post("/admin/toggle-post-status", requireAdmin, async (req, res) => {
  const { id, nextStatus, tab } = req.body;
  const status = nextStatus === 'close' ? 'close' : 'open';
  try {
    await dbPromise.query(
      'UPDATE pets SET post_status = ? WHERE id = ? LIMIT 1',
      [status, id]
    );
  } catch (err) {
    console.error('Toggle post status error:', err.message);
  }
  if (tab) return res.redirect(`/admin?tab=${tab}`);
  return res.redirect('/admin');
});

// ===== Pet management =====
// Admin add pet
app.get("/admin/add-pet", requireAdmin, (req, res) => {
  res.render("admin/add-pet", { user: req.user });
});

app.post("/admin/add-pet", requireAdmin, upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 }
]), async (req, res) => {
  const image1 = req.files?.image1?.[0] ? `/uploads/${req.files.image1[0].filename}` : '/cat.jpg';
  const image2 = req.files?.image2?.[0] ? `/uploads/${req.files.image2[0].filename}` : null;
  const image3 = req.files?.image3?.[0] ? `/uploads/${req.files.image3[0].filename}` : null;
  const ageYear = Number(req.body.age_year) || 0;
  const ageMonth = Number(req.body.age_month) || 0;
  const sterilized = req.body.sterilized || 'no';
  const postStatus = req.body.post_status || 'open';
  const adoptionStatus = req.body.adoption_status || 'available';
  const vaccinated = req.body.vaccinated || 'no';
  const providedPetId = req.body.pet_id || null;
  const [insertResult] = await dbPromise.query(
    `INSERT INTO pets
     (pet_id, name, type, gender, age_year, age_month, age_text, sterilized, post_status, adoption_status, vaccinated, color, details, image, image_2, image_3, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      providedPetId,
      req.body.name,
      req.body.type,
      req.body.gender,
      ageYear,
      ageMonth,
      req.body.age_text || null,
      sterilized,
      postStatus,
      adoptionStatus,
      vaccinated,
      req.body.color || null,
      req.body.details || null,
      image1,
      image2,
      image3,
      new Date()
    ]
  );
  // สร้างรหัสอัตโนมัติแบบ 001, 002, 003
  if (!providedPetId && insertResult && insertResult.insertId) {
    const generatedPetId = String(insertResult.insertId).padStart(3, '0');
    await dbPromise.query(
      'UPDATE pets SET pet_id = ? WHERE id = ? LIMIT 1',
      [generatedPetId, insertResult.insertId]
    );
  }
  res.redirect("/admin");
});

// Admin edit pet
app.get("/admin/edit-pet", requireAdmin, async (req, res) => {
  const pet = await fetchPetById(req.query.id);
  if (!pet) return res.redirect("/admin");
  res.render("admin/edit-pet", { user: req.user, pet: pet });
});

app.post("/admin/edit-pet", requireAdmin, upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 }
]), async (req, res) => {
  const rawId = Array.isArray(req.body.id) ? req.body.id[0] : req.body.id;
  const numericId = Number.parseInt(rawId, 10);
  if (!Number.isFinite(numericId)) {
    return res.redirect("/admin");
  }
  const existing = await fetchPetById(req.body.id);
  const image1 = req.files?.image1?.[0] ? `/uploads/${req.files.image1[0].filename}` : (existing?.image || '/cat.jpg');
  const image2 = req.files?.image2?.[0] ? `/uploads/${req.files.image2[0].filename}` : (existing?.image2 || null);
  const image3 = req.files?.image3?.[0] ? `/uploads/${req.files.image3[0].filename}` : (existing?.image3 || null);
  const ageYear = Number(req.body.age_year) || 0;
  const ageMonth = Number(req.body.age_month) || 0;
  const sterilized = req.body.sterilized || 'no';
  const postStatus = req.body.post_status || 'open';
  const adoptionStatus = req.body.adoption_status || 'available';
  const vaccinated = req.body.vaccinated || 'no';
  await dbPromise.query(
    `UPDATE 
      \`pets\` SET
      \`pet_id\` = ?,
      \`name\` = ?,
      \`type\` = ?,
      \`gender\` = ?,
      \`age_year\` = ?,
      \`age_month\` = ?,
      \`age_text\` = ?,
      \`sterilized\` = ?,
      \`post_status\` = ?,
      \`adoption_status\` = ?,
      \`vaccinated\` = ?,
      \`color\` = ?,
      \`details\` = ?,
      \`image\` = ?,
      \`image_2\` = ?,
      \`image_3\` = ?
     WHERE \`id\` = ?`,
    [
      req.body.pet_id || null,
      req.body.name,
      req.body.type,
      req.body.gender,
      ageYear,
      ageMonth,
      req.body.age_text || null,
      sterilized,
      postStatus,
      adoptionStatus,
      vaccinated,
      req.body.color || null,
      req.body.details || null,
      image1,
      image2,
      image3,
      numericId
    ]
  );
  res.redirect("/admin");
});

// ลบสัตว์ + เก็บลงตาราง delete
app.post("/admin/delete-pet", requireAdmin, async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      'SELECT pet_id, name, type, gender, age_year, age_month, age_text, sterilized, post_status, adoption_status, vaccinated, color, details, image, image_2, image_3, created_at FROM pets WHERE id = ? LIMIT 1',
      [req.body.id]
    );
    const pet = rows && rows[0];
    if (pet) {
      await dbPromise.query(
        `INSERT INTO \`delete\`
         (pet_id, name, type, gender, age_year, age_month, age_text, sterilized, post_status, adoption_status, vaccinated, color, details, image, image_2, image_3, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pet.pet_id,
          pet.name,
          pet.type,
          pet.gender,
          pet.age_year,
          pet.age_month,
          pet.age_text,
          pet.sterilized,
          pet.post_status,
          pet.adoption_status,
          pet.vaccinated,
          pet.color,
          pet.details,
          pet.image,
          pet.image_2,
          pet.image_3,
          pet.created_at
        ]
      );
    }
    await dbPromise.query('DELETE FROM pets WHERE id = ?', [req.body.id]);
    return res.redirect("/admin");
  } catch (err) {
    console.error('Delete pet error:', err.message);
    return res.redirect("/admin");
  }
});

// ===== External routers =====
const petRouter = require('./routes/pets');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

app.use('/', authRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/pets', petRouter);

// ===== Start server =====
app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});
*/

// ===== Refactored wiring =====
initMySql(dbPromise);

const authMiddleware = createAuthMiddleware({ dbPromise, sessions });
const { requireAdmin, requireUser } = authMiddleware;

const publicController = createPublicController();
const authController = createAuthController({ dbPromise, sessions });
const userController = createUserController({ dbPromise, viewCounts, searchProfiles, sessions });
const adminController = createAdminController({ dbPromise });

// ===== Public routes =====
app.get('/', publicController.landing);

// ===== User routes =====
app.get('/home', requireUser, userController.home);
app.get('/recommended', requireUser, userController.recommended);
app.get('/favorites', requireUser, userController.favorites);
app.get('/pet/:id', requireUser, userController.petDetail);

app.get('/notifications', requireUser, userController.notificationsPage);
app.get('/notifications/stream', requireUser, userController.notificationsStream);
app.get('/notifications/latest', requireUser, userController.notificationsLatest);

app.get('/profile/edit', requireUser, userController.editProfilePage);
app.post('/profile/edit', requireUser, userController.updateProfile);
app.get('/profile/password', requireUser, userController.changePasswordPage);
app.post('/profile/password', requireUser, userController.changePassword);

app.post('/favorites/toggle', requireUser, userController.toggleFavorite);

app.get('/signup', userController.signupPage);
app.post('/signup', userController.signup);
app.get('/forgot-password', userController.forgotPasswordPage);
app.post('/forgot-password', userController.forgotPassword);

// ===== Auth routes =====
app.get('/login', authController.loginPage);
app.post('/login', authController.login);
app.get('/logout', authController.logout);

// ===== Admin routes =====
app.get('/admin', requireAdmin, adminController.adminPage);
app.post('/admin/change-password', requireAdmin, adminController.changePassword);
app.post('/admin/toggle-post-status', requireAdmin, adminController.togglePostStatus);

app.get('/admin/add-pet', requireAdmin, adminController.getAddPet);
app.post('/admin/add-pet', requireAdmin, petUploadFields, adminController.postAddPet);

app.get('/admin/edit-pet', requireAdmin, adminController.getEditPet);
app.post('/admin/edit-pet', requireAdmin, petUploadFields, adminController.postEditPet);

app.post('/admin/delete-pet', requireAdmin, adminController.deletePet);

// ===== Start server =====
app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Server running http://${displayHost}:${PORT}`);
});
