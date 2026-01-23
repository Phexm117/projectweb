const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");  // 👈 ชี้ชัดว่า views อยู่ที่ไหน
app.use(express.static("public")); // 👈 ห้ามลืม

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

app.get("/admin", (req, res) => {
  res.render("admin");
});

app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});
