require('dotenv').config({ override: true });
const express = require("express");
const { dbPromise } = require('./db/mysql');
const multer = require('multer');
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");  // 👈 ชี้ชัดว่า views อยู่ที่ไหน
app.use(express.static("public")); // 👈 ห้ามลืม
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'public/uploads/' });

// Mock pet data
const pets = [
  { id: '1', name: 'โคนัน', gender: '♀', age: '2Y', type: 'cats', image: '/cat.jpg' },
  { id: '2', name: 'แมว 2', gender: '♂', age: '1Y', type: 'cats', image: '/conun.jpg' }
];

// User view counts for recommendations
const viewCounts = {}; // { userId: { petId: count } }

// Simple cookie parser middleware
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

// MySQL init + seed admin/user from env
async function initMySql() {
  try {
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
      )
    `);

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

// Middleware to check session
function requireLogin(req, res, next) {
  if (!req.cookies || !req.cookies.sessionId) {
    return res.redirect("/login");
  }
  const session = sessions[req.cookies.sessionId];
  if (!session) {
    return res.redirect("/login");
  }
  req.user = session.user;
  next();
}

app.get("/", (req, res) => {
  res.render("user/landing");
});

app.get("/home", requireLogin, (req, res) => {
  res.render("user/user_home", { user: req.user, pets: pets });
});

app.get("/recommended", requireLogin, (req, res) => {
  // Get user's view counts
  const userViews = viewCounts[req.user.id] || {};
  // Sort pets by view count descending
  const sortedPets = [...pets].sort((a, b) => (userViews[b.id] || 0) - (userViews[a.id] || 0));
  res.render("user/recommended", { user: req.user, pets: sortedPets });
});

app.get("/favorites", requireLogin, (req, res) => {
  res.render("user/favorites", { user: req.user, pets: pets });
});

app.get("/login", (req, res) => {
  res.render("user/login");
});

app.get("/signup", (req, res) => {
  res.render("user/signup");
});

app.get("/admin", requireLogin, (req, res) => {
  res.render("admin/admin", { user: req.user, pets: pets });
});

// Pet detail page
app.get("/pet/:id", requireLogin, (req, res) => {
  const petId = req.params.id;
  // Increment view count for this user and pet
  if (!viewCounts[req.user.id]) viewCounts[req.user.id] = {};
  viewCounts[req.user.id][petId] = (viewCounts[req.user.id][petId] || 0) + 1;

  // Mock pet data - in real app, would fetch from database
  const petData = pets.find(p => p.id === petId) || {
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
  }
  res.clearCookie("sessionId");
  res.redirect("/login");
});

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
    if (user.role === "admin") return res.redirect("/admin");
    return res.redirect("/home");
  } catch (err) {
    console.error('Login error:', err.message);
    return res.render("user/login", { error: "ระบบมีปัญหา โปรดลองอีกครั้ง" });
  }
});

// Admin add pet
app.get("/admin/add-pet", requireLogin, (req, res) => {
  res.render("admin/add-pet", { user: req.user });
});

app.post("/admin/add-pet", requireLogin, upload.single('image'), (req, res) => {
  const newId = (parseInt(pets[pets.length - 1].id) + 1).toString();
  const imagePath = req.file ? `/uploads/${req.file.filename}` : '/เเมว.jpg';
  const newPet = {
    id: newId,
    name: req.body.name,
    gender: req.body.gender,
    age: req.body.age,
    type: req.body.type,
    image: imagePath
  };
  pets.push(newPet);
  res.redirect("/admin");
});

// Admin edit pet
app.get("/admin/edit-pet", requireLogin, (req, res) => {
  const pet = pets.find(p => p.id === req.query.id);
  if (!pet) return res.redirect("/admin");
  res.render("admin/edit-pet", { user: req.user, pet: pet });
});

app.post("/admin/edit-pet", requireLogin, upload.single('image'), (req, res) => {
  const pet = pets.find(p => p.id === req.body.id);
  if (!pet) return res.redirect("/admin");
  pet.name = req.body.name;
  pet.gender = req.body.gender;
  pet.age = req.body.age;
  pet.type = req.body.type;
  if (req.file) pet.image = `/uploads/${req.file.filename}`;
  res.redirect("/admin");
});

const petRouter = require('./routes/pets');
const authRouter = require('./routes/auth');
app.use('/', authRouter);
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/pets', petRouter);

app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});
