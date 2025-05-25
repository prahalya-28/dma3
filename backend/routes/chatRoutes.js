/*port express from "express";
import { sendMessage, getMessages, startChat } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/start", protect, startChat);
router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);

export default router;
*/
import express from 'express';
import { startChat, getMessages, getUserChats } from '../controllers/chatController.js';
    import { protect as auth } from '../middleware/authMiddleware.js';

console.log('chatRoutes.js: File reached and exporting function.'); // Debug log

// Export a function that takes the router (app) as an argument
export default function chatRoutes(router) { // This is the function export
    console.log('chatRoutes.js: chatRoutes function called.'); // Debug log

    // Temporary test route (now defined directly on the router passed in)
    router.get('/api/chat/test', (req, res) => { // Note the full path here
        console.log('chatRoutes.js: /api/chat/test route hit.'); // Debug log
        res.json({ message: 'Chat routes test successful!' });
    });

    // Start or get existing chat
    router.post('/api/chat/start', auth, startChat); // Note the full path

    // Get chat history
    router.get('/api/chat/:chatId', auth, getMessages); // Note the full path

    // Get user's chats
    router.get('/api/chat/user/chats', auth, getUserChats); // Note the full path
}