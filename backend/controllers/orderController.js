import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createOrder = async (req, res) => {
    try {
        // Only block if user is in farmer mode
        if (req.user.role === 'farmer') {
            return res.status(403).json({ message: "Only customers can place orders." });
        }
        const { productId, quantity, deliveryMethod, deliveryDetails, specialInstructions } = req.body;
        console.log('--- Creating Order ---');
        console.log('User:', req.user?._id);
        console.log('Product:', productId);
        console.log('Quantity:', quantity);
        console.log('Delivery Method:', deliveryMethod);
        if (!productId || !quantity || !deliveryMethod) {
            console.error('Missing required fields:', { productId, quantity, deliveryMethod });
            return res.status(400).json({ message: "Missing required fields" });
        }
        const product = await Product.findById(productId).populate('farmer', 'name location');
        if (!product) {
            console.error('Product not found:', productId);
            return res.status(404).json({ message: "Product not found" });
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
        try {
            const createdOrder = await order.save();
            console.log('Order saved:', createdOrder._id);
            product.quantity -= quantity;
            await product.save();
            console.log('Product quantity after order:', product.quantity);
            const populatedOrder = await Order.findById(createdOrder._id)
                .populate('product', 'name image')
                .populate('farmer', 'name location');
            res.status(201).json(populatedOrder);
        } catch (saveErr) {
            console.error('Error saving order:', saveErr);
            return res.status(500).json({ message: "Failed to save order", error: saveErr.message });
        }
    } catch (error) {
        console.error('Error in createOrder (outer catch):', error);
        res.status(500).json({ message: "Failed to create order", error: error.message });
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
        const order = await Order.findById(req.params.id);

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

        // Update order status
        order.status = status;
        await order.save();

        // If order is rejected, restore product quantity
        if (status === 'rejected') {
            const product = await Product.findById(order.product);
            if (product) {
                product.quantity += order.quantity;
                await product.save();
            }
        }

        res.json({
            _id: order._id,
            status: order.status,
            updatedAt: order.updatedAt
        });
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

export const getMyOrders = async (req, res) => {
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
};
