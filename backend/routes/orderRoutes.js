import express from "express";
import { 
    createOrder, 
    getOrdersByUser,
    getFarmerOrders,
    updateOrderStatus,
    getOrderById,
    getMyOrders
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer routes
router.post("/", protect, createOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/farmer-orders", protect, getFarmerOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, updateOrderStatus);

export default router;
