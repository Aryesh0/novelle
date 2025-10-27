const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/user');

let razorpayInstance;

// Function to get or initialize Razorpay instance lazily
function getRazorpay() {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay keys are not configured in environment variables');
        }
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return razorpayInstance;
}

// Create Order for Premium Subscription
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        
        if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required'
            });
        }

        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: currency,
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: req.userId,
                subscriptionType: 'premium'
            }
        };

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            },
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

// Verify Payment and Activate Subscription
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,
            currency
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Update user subscription
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate subscription end date (1 month from now)
        const subscriptionStartDate = new Date();
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

        // Update user with premium subscription
        user.isPremium = true;
        user.subscriptionId = razorpay_payment_id;
        user.subscriptionStartDate = subscriptionStartDate;
        user.subscriptionEndDate = subscriptionEndDate;
        user.subscriptionStatus = 'active';
        
        // Add to payment history
        user.paymentHistory.push({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: amount / 100, // Convert back to rupees
            currency: currency,
            status: 'success',
            createdAt: new Date()
        });

        await user.save();

        // Update localStorage user data
        const updatedUser = {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            username: user.username,
            rating: user.rating,
            bio: user.bio,
            profilePicture: user.profilePicture,
            headerImage: user.headerImage,
            isPremium: user.isPremium,
            subscriptionEndDate: user.subscriptionEndDate
        };

        res.status(200).json({
            success: true,
            message: 'Payment verified and subscription activated!',
            user: updatedUser
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
};

// Check Subscription Status
exports.checkSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if subscription has expired
        if (user.isPremium && user.subscriptionEndDate < new Date()) {
            user.isPremium = false;
            user.subscriptionStatus = 'expired';
            await user.save();
        }

        res.status(200).json({
            success: true,
            subscription: {
                isPremium: user.isPremium,
                status: user.subscriptionStatus,
                startDate: user.subscriptionStartDate,
                endDate: user.subscriptionEndDate
            }
        });

    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check subscription status'
        });
    }
};

// Cancel Subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isPremium) {
            return res.status(400).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        user.isPremium = false;
        user.subscriptionStatus = 'cancelled';
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully'
        });

    } catch (error) {
        console.error('Subscription cancellation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription'
        });
    }
};