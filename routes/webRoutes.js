const express = require("express");
const router = express.Router();

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.cookies.adminToken) {
    return res.redirect("/login");
  }
  next();
};

// GET / - Home redirect to login or dashboard
router.get("/", (req, res) => {
  if (req.cookies.adminToken) {
    return res.redirect("/dashboard");
  }
  res.redirect("/login");
});

// GET /dashboard - Dashboard page
router.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard · G1QR Admin",
    activePage: "dashboard",
  });
});

// GET /dashboard/users - Users management
router.get("/dashboard/users", requireAuth, (req, res) => {
  res.render("users", {
    title: "App Users · G1QR Admin",
    activePage: "users",
  });
});

// GET /dashboard/qrcodes - QR Codes management
router.get("/dashboard/qrcodes", requireAuth, (req, res) => {
  res.render("qrcodes", {
    title: "QR Codes · G1QR Admin",
    activePage: "qrcodes",
  });
});

// GET /dashboard/plans - Membership plans
router.get("/dashboard/plans", requireAuth, (req, res) => {
  res.render("plans", {
    title: "Membership Plans · G1QR Admin",
    activePage: "plans",
  });
});

// GET /dashboard/purchases - Membership purchases
router.get("/dashboard/purchases", requireAuth, (req, res) => {
  res.render("purchases", {
    title: "Purchases · G1QR Admin",
    activePage: "purchases",
  });
});

// GET /dashboard/coupons - Coupons management
router.get("/dashboard/coupons", requireAuth, (req, res) => {
  res.render("coupons", {
    title: "Coupons · G1QR Admin",
    activePage: "coupons",
  });
});

// GET /dashboard/newsletter - Newsletter management
router.get("/dashboard/newsletter", requireAuth, (req, res) => {
  res.render("newsletter", {
    title: "Newsletter · G1QR Admin",
    activePage: "newsletter",
  });
});

module.exports = router;
