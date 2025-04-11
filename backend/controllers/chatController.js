import Chat from "../models/Chat.js";

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
