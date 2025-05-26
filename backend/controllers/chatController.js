import Chat from "../models/Chat.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

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
        const initiatingUserId = req.user._id; // The user initiating the chat (customer or farmer)
        const initiatingUserRole = req.user.role; // The role of the user initiating the chat

        const customerIdFromRequest = req.body.customerId; // Customer's ID from the request body (used by farmer initiating order chat)
        const farmerIdFromRequest = req.body.farmerId; // Farmer's ID from the request body (used by customer initiating product/order chat)
        const orderIdFromRequest = req.body.orderId; // Order ID from the request body (for order chat)
        const productIdFromRequest = req.body.productId; // Product ID from the request body (for product chat)

        let chat;
        let participant1Id;
        let participant2Id;
        let chatIdentifier = {}; // To find or create the chat (e.g., { order: orderId } or { product: productId })

        // Scenario 1: Order-based chat initiated by either participant (farmer or customer)
        if (orderIdFromRequest) {
            const order = await Order.findById(orderIdFromRequest);
            if (!order) {
                return res.status(404).json({ message: "Order not found for chat" });
            }

            // Determine the two participants of the order chat
            const orderCustomerId = order.user.toString();
            const orderFarmerId = order.farmer.toString();

            // Verify the initiating user is one of the participants
            if (initiatingUserId.toString() !== orderCustomerId && initiatingUserId.toString() !== orderFarmerId) {
                 return res.status(403).json({ message: "Not authorized to chat about this order" });
            }

            // Set participants for the chat based on the order participants
            participant1Id = orderCustomerId;
            participant2Id = orderFarmerId;
            chatIdentifier = { order: orderIdFromRequest };

        // Scenario 2: Product-based chat initiated by a customer from Product View
        } else if (productIdFromRequest && initiatingUserRole === 'buyer') {
            const product = await Product.findById(productIdFromRequest);
            if (!product) {
                 return res.status(404).json({ message: "Product not found for product chat" });
            }
            if (!product.farmer) {
                 return res.status(404).json({ message: "Farmer not found for this product" });
            }
            // Participants are the customer (initiating user) and the product's farmer
            participant1Id = initiatingUserId; // Customer's ID
            participant2Id = product.farmer; // Farmer's ID
            chatIdentifier = { product: productIdFromRequest };

             // If frontend also sent farmerId explicitly, ensure it matches the product's farmer
             if (farmerIdFromRequest && farmerIdFromRequest.toString() !== product.farmer.toString()) {
                  console.warn("Frontend provided farmerId for product chat that doesn't match product's farmer.");
                 // Decide how to handle this: Use product's farmer, or return error.
                 // For now, we will use the product's farmer ID.
             }

        } else { // Missing required parameters or invalid scenario
            return res.status(400).json({ message: "Missing required parameters or invalid chat initiation scenario." });
        }

        // Ensure both participant IDs are determined
        if (!participant1Id || !participant2Id) {
             return res.status(500).json({ message: "Could not determine chat participants." }); // Should not happen with correct logic
        }

        // Find or create the chat
        chat = await Chat.findOne({ 
            ...chatIdentifier,
            participants: { $all: [participant1Id, participant2Id] } 
        });

        if (!chat) {
            chat = new Chat({ ...chatIdentifier, participants: [participant1Id, participant2Id], messages: [] });
            await chat.save();
        }

        // Return the chat ID
        res.json({ chatId: chat._id });

    } catch (error) {
        console.error('Error in startChat:', error);
        // Check if it's a validation error and provide a more specific message
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: "Chat validation failed: " + error.message });
        }
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
        console.log('getUserChats: Function reached.'); // Debug log
        const userId = req.user._id;
        console.log('getUserChats: User ID from req.user:', userId); // Debug log

        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'name profilePicture')
            .populate('product', 'name image')
            .sort('-lastMessageAt');

        console.log('getUserChats: Database query result (chats):', chats); // Debug log

        res.json(chats);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({ message: 'Failed to fetch user chats' });
    }
};
