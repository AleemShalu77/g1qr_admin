const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

// GET /login - Render login page
router.get("/login", (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.cookies.adminToken) {
    return res.redirect("/dashboard");
  }
  res.render("login", { title: "Login · G1QR Admin" });
});

// GET /forgot-password - Render forgot password page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { title: "Forgot Password · G1QR Admin" });
});

// GET /reset-password/:token - Render reset password page
router.get("/reset-password/:token", (req, res) => {
  const { token } = req.params;
  res.render("reset-password", {
    title: "Reset Password · G1QR Admin",
    token: token,
  });
});

// GET /logout - Handle logout
router.get("/logout", async (req, res) => {
  res.clearCookie("adminToken", {
    path: "/",
    httpOnly: true,
    sameSite: "None", // required for cross-domain
    secure: true, // required on HTTPS
    domain: ".fairliefer.de", // <-- FIXED
    maxAge: 0, // immediately expire
  });
  res.redirect("/login");
});

module.exports = router;
