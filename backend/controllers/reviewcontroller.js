const Review = require('../models/review');
const Book = require('../models/book');
const User = require('../models/user');

// Add a review
exports.addReview = async (req, res) => {
    try {
        const { bookId, rating, reviewText } = req.body;
        const userId = req.userId;

        if (!bookId || !rating || !reviewText) {
            return res.status(400).json({
                success: false,
                message: 'Book ID, rating, and review text are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({ bookId, userId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this book'
            });
        }

        // Create new review
        const newReview = new Review({
            bookId,
            userId,
            username: user.username,
            userProfilePicture: user.profilePicture || '',
            rating,
            reviewText
        });

        await newReview.save();

        // Update book's average rating
        await updateBookRating(bookId);

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            review: newReview
        });

    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add review'
        });
    }
};

// Get reviews for a book
exports.getBookReviews = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const reviews = await Review.find({ bookId })
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Review.countDocuments({ bookId });

        res.status(200).json({
            success: true,
            reviews: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get book reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reviews'
        });
    }
};

// NEW: Get user's reviews
exports.getUserReviews = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.find({ userId })
            .populate('bookId', 'title authors thumbnail coverImage') // Populate book details for display
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Review.countDocuments({ userId });

        res.status(200).json({
            success: true,
            reviews: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user reviews'
        });
    }
};

// Update a review
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, reviewText } = req.body;
        const userId = req.userId;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own reviews'
            });
        }

        if (rating) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }
            review.rating = rating;
        }

        if (reviewText) {
            review.reviewText = reviewText;
        }

        review.updatedAt = Date.now();
        await review.save();

        // Update book's average rating
        await updateBookRating(review.bookId);

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            review: review
        });

    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review'
        });
    }
};

// Delete a review
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.userId;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        const bookId = review.bookId;
        await Review.findByIdAndDelete(reviewId);

        // Update book's average rating
        await updateBookRating(bookId);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review'
        });
    }
};

// Like/Unlike a review
exports.toggleLike = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.userId;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        const hasLiked = review.likedBy.includes(userId);

        if (hasLiked) {
            // Unlike
            review.likedBy = review.likedBy.filter(id => id.toString() !== userId);
            review.likes = Math.max(0, review.likes - 1);
        } else {
            // Like
            review.likedBy.push(userId);
            review.likes += 1;
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: hasLiked ? 'Review unliked' : 'Review liked',
            likes: review.likes,
            hasLiked: !hasLiked
        });

    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle like'
        });
    }
};

// Helper function to update book's average rating
async function updateBookRating(bookId) {
    try {
        const reviews = await Review.find({ bookId });
        
        if (reviews.length === 0) {
            await Book.findByIdAndUpdate(bookId, {
                averageRating: 0,
                reviewCount: 0
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await Book.findByIdAndUpdate(bookId, {
            averageRating: Math.round(averageRating * 10) / 10,
            reviewCount: reviews.length
        });
    } catch (error) {
        console.error('Update book rating error:', error);
    }
}