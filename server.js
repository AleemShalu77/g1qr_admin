// server.js
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.path.endsWith(".mjs")) res.type("application/javascript");
  next();
});

// Serve vendor assets
app.use(
  "/vendor/lodash",
  express.static(path.join(__dirname, "node_modules/lodash"))
);
app.use(
  "/vendor/dropzone",
  express.static(path.join(__dirname, "node_modules/dropzone/dist/"))
);
app.use(
  "/vendor/preline",
  express.static(path.join(__dirname, "node_modules/preline/dist"))
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
const webRoutes = require("./routes/webRoutes");
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");

app.use(webRoutes);
app.use(authRoutes);
app.use("/api", apiRoutes);

// Dev 500
app.get("/_dev/error", (req, res) => {
  throw new Error("Simulated server error");
});

// 404
app.use((req, res) => {
  res.status(404).render("errors/404", { title: "Page not found · G1QR Admin" });
});

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  const incidentId = Date.now().toString(36);
  res.status(500).render("errors/500", {
    title: "Something went wrong · G1QR Admin",
    incidentId,
    stack: app.get("env") !== "production" ? err.stack : null,
  });
});

app.listen(5001, () => console.log("G1QR Admin running http://localhost:5001"));

