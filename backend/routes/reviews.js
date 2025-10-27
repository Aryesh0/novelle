const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const reviewController = require('../controllers/reviewcontroller');

// Public routes
router.get('/book/:bookId', reviewController.getBookReviews);

// NEW: Protected route for user's reviews
router.get('/user', authenticateToken, reviewController.getUserReviews);

// Protected routes
router.post('/add', authenticateToken, reviewController.addReview);
router.put('/:reviewId', authenticateToken, reviewController.updateReview);
router.delete('/:reviewId', authenticateToken, reviewController.deleteReview);
router.post('/:reviewId/like', authenticateToken, reviewController.toggleLike);

module.exports = router;