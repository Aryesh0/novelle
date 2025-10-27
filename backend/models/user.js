const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    bio: {
        type: String,
        default: '',
        maxlength: 5000
    },
    profilePicture: {
        type: String,
        default: ''
    },
    headerImage: {
        type: String,
        default: ''
    },
    // Premium Subscription Fields
    isPremium: {
        type: Boolean,
        default: false
    },
    subscriptionId: {
        type: String,
        default: null
    },
    subscriptionStartDate: {
        type: Date,
        default: null
    },
    subscriptionEndDate: {
        type: Date,
        default: null
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'none'],
        default: 'none'
    },
    paymentHistory: [{
        orderId: String,
        paymentId: String,
        amount: Number,
        currency: String,
        status: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);