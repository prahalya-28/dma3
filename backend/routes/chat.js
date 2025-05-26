import express from 'express';
import { startChat, getMessages, getUserChats } from '../controllers/chatController.js';
import auth from '../middleware/auth.js';

console.log('chatRoutes.js: File reached.'); // Debug log

const router = express.Router();

// Temporary test route
router.get('/test', (req, res) => {
    res.json({ message: 'Chat routes test successful!' });
});

// Start or get existing chat
router.post('/start', auth, startChat);

// Get chat history
router.get('/:chatId', auth, getMessages);

// Get user's chats
router.get('/user/chats', auth, getUserChats);

export default router; 