const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookcontroller');

// Public routes (no auth required)
router.get('/search', bookController.searchBooks);
router.get('/genre/:genre', bookController.getBooksByGenre);
router.get('/featured', bookController.getFeaturedBooks);
router.get('/all', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

module.exports = router;