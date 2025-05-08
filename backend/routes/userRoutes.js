import express from "express";
import { registerUser, loginUser, becomeFarmer, toggleUserRole, getUserProfile, getMe, requestPasswordReset, resetPassword, updateUserProfile } 
from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js"; // Ensure authentication
//import { loginUser } from "../controllers/userController.js";


const router = express.Router();
router.get("/", (req, res) => {
    res.json({ message: "Users route is working!" });
  });
router.post("/register", registerUser);
router.post("/login", loginUser); // Add this line
router.post("/become-farmer", protect, becomeFarmer);

router.post("/toggle-role", protect, toggleUserRole);

router.get("/profile", protect, getUserProfile); // NEW ROUTE
router.get("/me", protect, getMe);

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.put("/profile", protect, updateUserProfile);

export default router;
