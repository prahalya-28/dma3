import Chat from "../models/Chat.js";
import Order from "../models/Order.js";

export const sendMessage = async (req, res) => {
    const { chatId, message } = req.body;
    const chatMessage = new Chat({ chatId, sender: req.user._id, message });
    const savedMessage = await chatMessage.save();
    res.status(201).json(savedMessage);
};

export const getMessages = async (req, res) => {
    const messages = await Chat.find({ chatId: req.params.chatId });
    res.json(messages);
};

// Start or get a chat between customer and farmer for an order
export const startChat = async (req, res) => {
    try {
        const { farmerId, orderId } = req.body;
        const userId = req.user._id;

        // Find the order and ensure the user is part of it
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.user.toString() !== userId.toString() && order.farmer.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized for this order" });
        }

        // Find existing chat
        let chat = await Chat.findOne({ order: orderId, $or: [ { sender: userId, receiver: farmerId }, { sender: farmerId, receiver: userId } ] });
        if (!chat) {
            // Create a new chat document (no message yet)
            chat = new Chat({ order: orderId, sender: userId, receiver: farmerId, message: "" });
            await chat.save();
        }
        res.json({ chatId: chat._id });
    } catch (error) {
        console.error('Error in startChat:', error);
        res.status(500).json({ message: "Failed to start chat" });
    }
};
