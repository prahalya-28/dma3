import express from "express";
import { createOrder, getOrdersByUser } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/myorders", protect, getOrdersByUser);

export default router;
