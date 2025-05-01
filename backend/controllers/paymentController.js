import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import crypto from 'crypto';

// Initialize Razorpay only if credentials are available
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Create a Razorpay order
export const createOrder = async (req, res) => {
  try {
    // Check if Razorpay is initialized
    if (!razorpay) {
      return res.status(500).json({ 
        message: 'Payment service not configured. Please contact administrator.' 
      });
    }

    const { orderId, amount } = req.body;

    // Validate order exists and is in accepted state
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'accepted') {
      return res.status(400).json({ message: 'Order is not in accepted state' });
    }

    // Create Razorpay order
    const options = {
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: orderId
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Error creating payment order' });
  }
};

// Verify payment signature
export const verifyPayment = async (req, res) => {
  try {
    // Check if Razorpay is initialized
    if (!razorpay) {
      return res.status(500).json({ 
        message: 'Payment service not configured. Please contact administrator.' 
      });
    }

    const { orderId, paymentId, signature } = req.body;

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update order status to paid
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status: 'paid',
        paymentId,
        paymentDate: new Date()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
}; 