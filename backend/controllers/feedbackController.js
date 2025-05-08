const Feedback = require('../models/Feedback');
const Product = require('../models/Product');

// Create new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const customerId = req.user._id;

    // Get product to find farmer
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      customer: customerId,
      product: productId
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already left feedback for this product' });
    }

    const feedback = new Feedback({
      customer: customerId,
      farmer: product.farmer,
      product: productId,
      rating,
      comment
    });

    await feedback.save();

    // Populate customer and farmer details
    await feedback.populate('customer', 'name');
    await feedback.populate('farmer', 'name');

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Error creating feedback' });
  }
};

// Get feedback for a product
exports.getProductFeedback = async (req, res) => {
  try {
    const { productId } = req.params;
    const feedback = await Feedback.find({ product: productId })
      .populate('customer', 'name')
      .populate('farmer', 'name')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
};

// Get feedback for a farmer
exports.getFarmerFeedback = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const feedback = await Feedback.find({ farmer: farmerId })
      .populate('customer', 'name')
      .populate('product', 'name image')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
};

// Delete feedback (only by the customer who created it)
exports.deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if the user is the one who created the feedback
    if (feedback.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this feedback' });
    }

    await feedback.remove();
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Error deleting feedback' });
  }
}; 