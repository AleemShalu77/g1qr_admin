const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

// Auth middleware - check for adminToken cookie
const requireAuth = (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token) {
    return res.status(401).json({
      status: false,
      error: "Unauthorized - Please login again",
    });
  }
  req.adminToken = token;
  next();
};

// Helper function to make API requests
async function apiRequest(method, endpoint, token, data = null) {
  const config = {
    withCredentials: true,
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  };

  if (data && (method === "POST" || method === "PATCH" || method === "PUT")) {
    config.data = data;
  }

  const response = await axios(config);
  return response.data;
}

// ============ COUPON ROUTES ============

// GET /api/coupons - List coupons
router.get("/coupons", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    let endpoint = `/couponAdmin/coupon?page=${page}&limit=${limit}`;
    if (isActive !== undefined && isActive !== "") {
      endpoint += `&isActive=${isActive}`;
    }

    const data = await apiRequest("GET", endpoint, req.adminToken);
    res.json(data);
  } catch (error) {
    console.error("List coupons error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch coupons",
    });
  }
});

// POST /api/coupons - Create coupon
router.post("/coupons", requireAuth, async (req, res) => {
  try {
    const data = await apiRequest(
      "POST",
      "/couponAdmin/addCoupon",
      req.adminToken,
      req.body
    );
    res.json(data);
  } catch (error) {
    console.error(
      "Create coupon error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to create coupon",
    });
  }
});

// PATCH /api/coupons/:id/toggle - Toggle coupon status
router.patch("/coupons/:id/toggle", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await apiRequest(
      "PATCH",
      `/couponAdmin/coupon/${id}/toggle`,
      req.adminToken,
      req.body
    );
    res.json(data);
  } catch (error) {
    console.error(
      "Toggle coupon error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to toggle coupon",
    });
  }
});

// DELETE /api/coupons/:id - Delete coupon
router.delete("/coupons/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await apiRequest(
      "DELETE",
      `/admin/coupon/${id}`,
      req.adminToken
    );
    res.json(data);
  } catch (error) {
    console.error(
      "Delete coupon error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to delete coupon",
    });
  }
});

// ============ MEMBERSHIP PLAN ROUTES ============

// GET /api/plans - List membership plans
router.get("/plans", requireAuth, async (req, res) => {
  try {
    const { isActive } = req.query;
    let endpoint = `/appUser/membership/plans?isAdmin=true`;
    if (isActive !== undefined && isActive !== "") {
      endpoint += `&isActive=${isActive}`;
    }

    const data = await apiRequest("GET", endpoint, req.adminToken);
    res.json(data);
  } catch (error) {
    console.error("List plans error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error || error.message || "Failed to fetch plans",
    });
  }
});

// POST /api/plans - Create membership plan
router.post("/plans", requireAuth, async (req, res) => {
  try {
    const data = await apiRequest(
      "POST",
      "/admin/membership-plan",
      req.adminToken,
      req.body
    );
    res.json(data);
  } catch (error) {
    console.error("Create plan error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error || error.message || "Failed to create plan",
    });
  }
});

// POST /api/plans/:id/toggle-active - Toggle plan status
router.post("/plans/:id/toggle-active", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await apiRequest(
      "POST",
      `/appUser/membership-plan/${id}/toggle-active`,
      req.adminToken,
      {}
    );
    res.json(data);
  } catch (error) {
    console.error("Toggle plan error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error || error.message || "Failed to toggle plan",
    });
  }
});

// ============ MEMBERSHIP PURCHASES ROUTES ============

// GET /api/purchases - List membership purchases
router.get("/purchases", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const endpoint = `/appUser/membership-purchases?page=${page}&limit=${limit}`;

    const data = await apiRequest("GET", endpoint, req.adminToken);
    res.json(data);
  } catch (error) {
    console.error(
      "List purchases error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch purchases",
    });
  }
});

// ============ APP USERS ROUTES ============

// GET /api/users - List app users with profiles
router.get("/users", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const endpoint = `/appUser/admin/users?page=${page}&limit=${limit}`;

    const data = await apiRequest("GET", endpoint, req.adminToken);
    res.json(data);
  } catch (error) {
    console.error("List users error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error || error.message || "Failed to fetch users",
    });
  }
});

// ============ QR CODES ROUTES ============

// GET /api/qr-batches - List QR batches
router.get("/qr-batches", requireAuth, async (req, res) => {
  try {
    const data = await apiRequest("GET", "/appUser/qr-batches", req.adminToken);
    res.json(data);
  } catch (error) {
    console.error(
      "List QR batches error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch QR batches",
    });
  }
});

// GET /api/qrcodes - List QR codes
router.get("/qrcodes", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, batch_code, qr_code_id } = req.query;
    let endpoint = `/appUser/admin/qrcodes?page=${page}&limit=${limit}`;

    if (batch_code) {
      endpoint += `&batch_code=${encodeURIComponent(batch_code)}`;
    }

    if (qr_code_id) {
      endpoint += `&qr_code_id=${encodeURIComponent(qr_code_id)}`;
    }

    const data = await apiRequest("GET", endpoint, req.adminToken);
    res.json(data);
  } catch (error) {
    console.error(
      "List QR codes error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch QR codes",
    });
  }
});

// POST /api/qrcodes/generate - Generate QR codes in bulk
router.post("/qrcodes/generate", requireAuth, async (req, res) => {
  try {
    const data = await apiRequest(
      "POST",
      "/appUser/qr-codes/bulk",
      req.adminToken,
      req.body
    );
    res.json(data);
  } catch (error) {
    console.error(
      "Generate QR codes error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to generate QR codes",
    });
  }
});

// POST /api/qrcodes/export - Export QR codes
router.post("/qrcodes/export", requireAuth, async (req, res) => {
  try {
    const data = await apiRequest(
      "POST",
      "/appUser/qr-codes/export",
      req.adminToken,
      req.body
    );
    res.json(data);
  } catch (error) {
    console.error(
      "Export QR codes error:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      status: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Failed to export QR codes",
    });
  }
});

module.exports = router;
