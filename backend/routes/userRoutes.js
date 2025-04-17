import express from "express";
import { registerUser, becomeFarmer, toggleUserRole, getUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js"; // Ensure authentication
import { loginUser } from "../controllers/userController.js";


const router = express.Router();
router.get("/", (req, res) => {
    res.json({ message: "Users route is working!" });
  });
router.post("/register", registerUser);
router.patch("/become-farmer", becomeFarmer);
router.patch("/toggle-role", toggleUserRole);
router.get("/profile", protect, getUserProfile); // NEW ROUTE
router.post("/login", loginUser); // Add this line

export default router;
