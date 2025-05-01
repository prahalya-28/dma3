import express from "express";
import { createProduct, getAllProducts, getMyProducts, updateProduct, getProductById } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ import protect
// Protected routes
//app.use("/api/products", protect, productRoutes);
const router = express.Router();

router.get("/", getAllProducts);
router.post("/", protect, createProduct); // ✅ Protect this route
router.get("/my-products", protect, getMyProducts);
router.put("/:id", protect, updateProduct);
router.get("/:id", getProductById); // Add route for getting single product

export default router;
