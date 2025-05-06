import express from "express";
import { 
    createOrder, 
    getOrdersByUser,
    getFarmerOrders,
    updateOrderStatus,
    getOrderById
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer routes
router.post("/", protect, createOrder);
router.get("/myorders", protect, getOrdersByUser);
router.get("/:id", protect, getOrderById);

// Farmer routes
router.get("/farmer-orders", protect, getFarmerOrders);
router.put("/:id/status", protect, updateOrderStatus);

export default router;
