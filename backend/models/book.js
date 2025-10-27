const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    googleBooksId: {
        type: String,
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: true
    },
    authors: [{
        type: String
    }],
    description: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String,
        default: ''
    },
    thumbnail: {
        type: String,
        default: ''
    },
    categories: [{
        type: String
    }],
    isbn: {
        type: String,
        default: ''
    },
    publishedDate: {
        type: String,
        default: ''
    },
    publisher: {
        type: String,
        default: ''
    },
    pageCount: {
        type: Number,
        default: 0
    },
    language: {
        type: String,
        default: 'en'
    },
    averageRating: {
        type: Number,
        default: 0
    },
    ratingsCount: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    // For premium/free distinction
    isPremium: {
        type: Boolean,
        default: false
    },
    rentalPrice: {
        type: Number,
        default: 0
    },
    purchasePrice: {
        type: Number,
        default: 0
    },
    // Cache timestamp
    cachedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Index for faster searches - FIXED: Added default_language 'english' to prevent override errors
bookSchema.index({ title: 'text', authors: 'text', description: 'text' }, { default_language: 'english' });
bookSchema.index({ categories: 1 });
bookSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Book', bookSchema);