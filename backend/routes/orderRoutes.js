import express from "express";
import { 
    createOrder, 
    getOrdersByUser,
    getFarmerOrders,
    updateOrderStatus
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer routes
router.post("/", protect, createOrder);
router.get("/myorders", protect, getOrdersByUser);

// Farmer routes
router.get("/farmer-orders", protect, getFarmerOrders);
router.put("/:id/status", protect, updateOrderStatus);

export default router;
