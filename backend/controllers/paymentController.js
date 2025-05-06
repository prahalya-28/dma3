import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Get order details
        const order = await Order.findById(orderId)
            .populate('product', 'name')
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if user owns this order
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to pay for this order" });
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: order.totalPrice * 100, // Convert to paise
            currency: "INR",
            receipt: orderId,
            notes: {
                orderId: orderId
            }
        });

        res.json({
            key_id: process.env.RAZORPAY_KEY_ID,
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });
    } catch (error) {
        console.error('Error in createOrder:', error);
        res.status(500).json({ message: "Failed to create payment order" });
    }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const { orderId, razorpayOrderId, paymentId, signature } = req.body;

        // Verify signature
        const body = razorpayOrderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== signature) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        // Update order status
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.status = "paid";
        await order.save();

        res.json({ message: "Payment verified successfully" });
    } catch (error) {
        console.error('Error in verifyPayment:', error);
        res.status(500).json({ message: "Failed to verify payment" });
    }
}; 