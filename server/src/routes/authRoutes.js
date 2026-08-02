const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleAuth,
  refreshToken,
  getCurrentUser,
  logoutUser,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

// Public Authentication Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/refresh", refreshToken);

// Protected Authentication Routes
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logoutUser);

module.exports = router;
