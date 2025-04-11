import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
    const { orderItems, totalPrice } = req.body;
    const order = new Order({
        user: req.user._id,
        orderItems,
        totalPrice
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
};

export const getOrdersByUser = async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
};
