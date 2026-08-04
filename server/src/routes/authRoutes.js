const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleAuth,
  refreshToken,
  getCurrentUser,
  logoutUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

// Public Authentication Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);

// Protected Authentication Routes
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logoutUser);

module.exports = router;
