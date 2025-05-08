import Chat from "../models/Chat.js";
import Order from "../models/Order.js";

export const sendMessage = async (req, res) => {
    const { chatId, message } = req.body;
    const chatMessage = new Chat({ chatId, sender: req.user._id, message });
    const savedMessage = await chatMessage.save();
    res.status(201).json(savedMessage);
};

export const getMessages = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', 'name profilePicture')
            .populate('messages.sender', 'name profilePicture')
            .populate('product', 'name image');
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ message: 'Failed to fetch chat' });
    }
};

// Start or get a chat between customer and farmer for an order
export const startChat = async (req, res) => {
    try {
        const farmerId = req.body.farmerId;
        const orderId = req.body.orderId;
        const productId = req.body.productId;
        const userId = req.user._id;

        let chat;
        // If orderId is provided, use order-based chat logic
        if (orderId) {
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }
            if (order.user.toString() !== userId.toString() && order.farmer.toString() !== userId.toString()) {
                return res.status(403).json({ message: "Not authorized for this order" });
            }
            chat = await Chat.findOne({ order: orderId, participants: { $all: [userId, farmerId] } });
            if (!chat) {
                chat = new Chat({ order: orderId, participants: [userId, farmerId], messages: [] });
                await chat.save();
            }
        } else if (productId && farmerId) {
            // Product-based chat (pre-order inquiry)
            chat = await Chat.findOne({ product: productId, participants: { $all: [userId, farmerId] } });
            if (!chat) {
                chat = new Chat({ product: productId, participants: [userId, farmerId], messages: [] });
                await chat.save();
            }
        } else {
            return res.status(400).json({ message: "Missing required parameters" });
        }
        res.json({ chatId: chat._id });
    } catch (error) {
        console.error('Error in startChat:', error);
        res.status(500).json({ message: "Failed to start chat" });
    }
};

export function initializeSocket(io) {
    io.on('connection', (socket) => {
        // You can add authentication here if needed
        console.log('A user connected to chat');

        // Join a chat room
        socket.on('join-chat', (chatId) => {
            socket.join(chatId);
        });

        // Handle sending a message
        socket.on('send-message', async ({ chatId, content, senderId }) => {
            try {
                // Find the chat and push the new message
                const chat = await Chat.findById(chatId).populate('participants', 'name profilePicture');
                if (!chat) return;
                const message = {
                    sender: senderId,
                    content,
                    createdAt: new Date(),
                    read: false
                };
                chat.messages.push(message);
                chat.lastMessageAt = new Date();
                await chat.save();
                // Populate sender for frontend
                const populatedMessage = await chat.populate({
                    path: 'messages.sender',
                    select: 'name profilePicture'
                });
                const lastMsg = populatedMessage.messages[populatedMessage.messages.length - 1];
                // Emit to all users in the chat room
                io.to(chatId).emit('new-message', {
                    chatId,
                    message: lastMsg
                });
            } catch (err) {
                console.error('Socket send-message error:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected from chat');
        });
    });
}

export const getUserChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'name profilePicture')
            .populate('product', 'name image')
            .sort('-lastMessageAt');
        res.json(chats);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({ message: 'Failed to fetch user chats' });
    }
};
