const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middleware/auth');

// Create feedback
router.post('/', auth, feedbackController.createFeedback);

// Get feedback for a product
router.get('/product/:productId', feedbackController.getProductFeedback);

// Get feedback for a farmer
router.get('/farmer/:farmerId', feedbackController.getFarmerFeedback);

// Delete feedback
router.delete('/:feedbackId', auth, feedbackController.deleteFeedback);

module.exports = router; 