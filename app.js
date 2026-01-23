const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");  // 👈 ชี้ชัดว่า views อยู่ที่ไหน
app.use(express.static("public")); // 👈 ห้ามลืม
app.use(express.urlencoded({ extended: true }));

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

// User storage with test admin account
const users = {
  "67026203@up.ac.th": { email: "67026203@up.ac.th", password: "admin", name: "admin" }
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

app.get("/home", requireLogin, (req, res) => {
  res.render("user_home", { user: req.user });
});

app.get("/recommended", requireLogin, (req, res) => {
  res.render("recommended", { user: req.user });
});

app.get("/favorites", requireLogin, (req, res) => {
  res.render("favorites", { user: req.user });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/admin", requireLogin, (req, res) => {
  res.render("admin", { user: req.user });
});

app.get("/logout", (req, res) => {
  // Clear session
  if (req.cookies.sessionId) {
    delete sessions[req.cookies.sessionId];
  }
  res.clearCookie("sessionId");
  res.redirect("/login");
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
  res.redirect("/admin");
});

app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});
