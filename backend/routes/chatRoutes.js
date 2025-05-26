import express from "express";
import { sendMessage, getMessages, startChat } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

/*
const router = express.Router();
router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
*/

// Export a function that takes the router (app) as an argument
export default function chatRoutes(router) {
    console.log('chatRoutes.js: chatRoutes function called.'); // Debug log

    // Define routes using the router argument
    router.post("/api/chat", protect, sendMessage); // Use full path
    router.get("/api/chat/:chatId", protect, getMessages); // Use full path
    router.post("/api/chat/start", protect, startChat); // Added startChat route

    // Note: The previous test route /api/chat/test is removed as it's not standard
}
