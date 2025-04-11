import express from "express";
import { sendMessage, getMessages } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);

export default router;
