import express from "express";
import {
  registerUser,
  loginUser,
  resetPassword,
  verifyOtp,
  verifyUser,
  becomeFarmer,
  toggleUserRole,
  getUserProfile,
  getMe,
  requestPasswordReset, // Add this
  resetPasswordWithToken, // Add this
  updateUserProfile // Add this
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Test route
router.get("/", (req, res) => {
  res.json({ message: "Users route is working!" });
});

// User registration
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Email/phone verification
router.post("/verify", verifyUser);

// Password reset (OTP-based)
router.post("/reset-password", resetPassword);

// OTP verification for password reset
router.post("/verify-otp", verifyOtp);

// Token-based password reset
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password-token", resetPasswordWithToken);

// Token validation
router.post("/validate-token", protect, (req, res) => {
  res.json({ valid: true });
});

// Farmer registration and role toggle
router.post("/become-farmer", protect, becomeFarmer);
router.post("/toggle-role", protect, toggleUserRole);

// User profile
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/me", protect, getMe);

export default router;