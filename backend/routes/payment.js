const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create Razorpay Order
router.post('/create-order', authenticateToken, paymentController.createOrder);

// Verify Payment
router.post('/verify-payment', authenticateToken, paymentController.verifyPayment);

// Check Subscription Status
router.get('/subscription-status', authenticateToken, paymentController.checkSubscription);

// Cancel Subscription
router.post('/cancel-subscription', authenticateToken, paymentController.cancelSubscription);

module.exports = router;