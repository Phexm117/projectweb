const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");  // 👈 ชี้ชัดว่า views อยู่ที่ไหน
app.use(express.static("public")); // 👈 ห้ามลืม
app.use(express.urlencoded({ extended: true }));

// Session storage (in-memory)
const sessions = {};

// User storage with test admin account
const users = {
  "67026203@gmail.com": { email: "67026203@gmail.com", password: "admin", name: "admin" }
};

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
  res.render("landing");
});

app.get("/home", (req, res) => {
  res.render("user_home");
});

app.get("/recommended", (req, res) => {
  res.render("recommended");
});

app.get("/favorites", (req, res) => {
  res.render("favorites");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.render("signup", { error: "กรุณากรอกข้อมูลให้ครบ" });
  }
  if (users[email]) {
    return res.render("signup", { error: "อีเมลนี้ถูกใช้งานแล้ว" });
  }
  users[email] = { name, email, password };
  res.redirect("/login?signup=success");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user || user.password !== password) {
    return res.render("login", { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }
  const sessionId = Math.random().toString(36).substring(7);
  sessions[sessionId] = { user };
  res.cookie("sessionId", sessionId, { httpOnly: true });
  res.redirect("/home");
});

app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});
