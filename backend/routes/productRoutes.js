import express from "express";
import { createProduct, getAllProducts } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ import protect
// Protected routes
//app.use("/api/products", protect, productRoutes);
const router = express.Router();

router.get("/", getAllProducts);
router.post("/", protect, createProduct); // ✅ Protect this route

export default router;
