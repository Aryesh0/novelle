const mongoose = require('mongoose');
const userBookSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    status: {
        type: String,
        enum: ['want-to-read', 'currently-reading', 'finished'],
        default: 'want-to-read'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    startedAt: {
        type: Date,
        default: null
    },
    finishedAt: {
        type: Date,
        default: null
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one entry per user-book combination
userBookSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('UserBook', userBookSchema);