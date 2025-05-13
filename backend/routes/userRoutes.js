import express from "express";
import { registerUser, loginUser, resetPassword, verifyOtp, verifyUser, becomeFarmer, toggleUserRole, getUserProfile, getMe } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Test route
router.get("/", (req, res) => {
  res.json({ message: "Users route is working!" });
});

// User registration (Signup TC1-TC6, TC9)
router.post("/register", registerUser);

// User login (Login TC1-TC5, TC9)
router.post("/login", loginUser);

// Email/phone verification (Signup TC6, TC7)
router.post("/verify", verifyUser);

// Password reset (Login TC6)
router.post("/reset-password", resetPassword);

// OTP verification for password reset (Login TC6)
router.post("/verify-otp", verifyOtp);

// Token validation (Login TC7)
router.post("/validate-token", protect, (req, res) => {
  res.json({ valid: true });
});

// Farmer registration and role toggle (optional)
router.post("/become-farmer", protect, becomeFarmer);
router.post("/toggle-role", protect, toggleUserRole);

// User profile (optional)
router.get("/profile", protect, getUserProfile);
router.get("/me", protect, getMe);

export default router;