import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from '../models/User.js';
import { sendOrderStatusEmail } from '../utils/emailService.js';

export const createOrder = async (req, res) => {
    try {
        const { productId, quantity, deliveryMethod, deliveryDetails, specialInstructions } = req.body;

        if (!productId || !quantity || !deliveryMethod) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const product = await Product.findById(productId).populate('farmer', 'name location');
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.quantity === 0) {
            return res.status(400).json({ message: "Product is out of stock" });
        }

        if (product.quantity < quantity) {
            console.error('Requested quantity not available:', { available: product.quantity, requested: quantity });
            return res.status(400).json({ message: "Requested quantity not available" });
        }
        const totalPrice = product.price * quantity;
        const order = new Order({
            user: req.user._id,
            product: productId,
            farmer: product.farmer._id,
            quantity,
            pricePerUnit: product.price,
            totalPrice,
            deliveryMethod,
            deliveryDetails,
            specialInstructions,
            status: 'pending'
        });

        const createdOrder = await order.save();

        product.quantity -= quantity;
        await product.save();

        const populatedOrder = await Order.findById(createdOrder._id)
            .populate('product', 'name image')
            .populate('farmer', 'name location')
            .populate('user', 'name email');

        // Simulate order confirmation notification (TC1, TC3, TC6)
        console.log(`Order confirmation sent to customer ${populatedOrder.user.email}: Order #${populatedOrder._id} placed successfully for ${populatedOrder.product.name}`);

        res.status(201).json(populatedOrder);
    } catch (error) {
        console.error('Error in createOrder:', error);
        res.status(500).json({ message: "Failed to create order" });
    }
};

export const getOrdersByUser = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('product', 'name image')
            .populate('farmer', 'name location')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        console.error('Error in getOrdersByUser:', error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

// @desc    Get orders for a farmer
// @route   GET /api/orders/farmer-orders
// @access  Private (Farmer)
export const getFarmerOrders = async (req, res) => {
    try {
        console.log('--- Fetching Farmer Orders ---');
        console.log('Farmer:', req.user._id);
        const orders = await Order.find({ farmer: req.user._id })
            .populate('user', 'name email')
            .populate('product', 'name image')
            .sort('-createdAt');
        console.log('Orders found:', orders.length);
        res.json(orders);
    } catch (error) {
        console.error('Error in getFarmerOrders:', error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Farmer)
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id)
            .populate('product')
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if the user is the farmer who owns this order
        if (order.farmer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this order" });
        }

        // Validate status
        const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        if (order.status === 'accepted' && status === 'rejected') {
            return res.status(400).json({ message: "Cannot reject an already accepted order" });
        }

        // Update order status
        order.status = status;
        await order.save();

        // If order is rejected, restore product quantity
        if (status === 'rejected') {
            const product = await Product.findById(order.product._id);
            if (product) {
                product.quantity += order.quantity;
                await product.save();
            }
        }

        console.log(`Notification sent to customer ${order.user.email}: Order #${order._id} status updated to ${status}`);

        res.json(order);
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({ message: "Failed to update order status" });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('product', 'name image')
            .populate('farmer', 'name location')
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if the user is either the buyer or the farmer
        if (order.user._id.toString() !== req.user._id.toString() && 
            order.farmer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to view this order" });
        }

        res.json(order);
    } catch (error) {
        console.error('Error in getOrderById:', error);
        res.status(500).json({ message: "Failed to fetch order" });
    }
};

/*export const getMyOrders = async (req, res) => {
    try {
        console.log('--- Fetching My Orders ---');
        console.log('User:', req.user._id);
        const orders = await Order.find({ user: req.user._id })
            .populate('farmer', 'name _id location profilePicture')
            .populate('product', 'name image');
        console.log('Orders found:', orders.length);
        res.json(orders);
    } catch (error) {
        console.error('Error in getMyOrders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};*/
export const getMyOrders = async (req, res) => {
    try {
        console.log('--- Fetching My Orders ---');
        console.log('User:', req.user._id);
        const orders = await Order.find({ user: req.user._id })
            .populate('farmer', 'name _id location profilePicture')
            .populate('product', 'name image');
        console.log('Orders found:', orders.length);
        // Log orders with missing products
        const ordersWithMissingProducts = orders.filter(order => !order.product);
        if (ordersWithMissingProducts.length > 0) {
            console.log('Orders with missing products:', ordersWithMissingProducts.map(order => order._id));
        }
        res.json(orders);
    } catch (error) {
        console.error('Error in getMyOrders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};
