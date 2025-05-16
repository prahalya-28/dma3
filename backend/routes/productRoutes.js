import express from "express";
import { createProduct, getAllProducts, getMyProducts, updateProduct, getProductById, deleteProduct } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllProducts);
router.post("/", protect, createProduct);
router.get("/my-products", protect, getMyProducts);
router.put("/:id", protect, updateProduct);
router.get("/:id", getProductById);
router.delete("/:id", protect, deleteProduct);

export default router;