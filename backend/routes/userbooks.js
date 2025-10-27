const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userBookController = require('../controllers/userbookcontroller');

// All routes require authentication
router.post('/add', authenticateToken, userBookController.addToLibrary);
router.put('/:bookId/status', authenticateToken, userBookController.updateStatus);
router.get('/library', authenticateToken, userBookController.getUserLibrary);
router.delete('/:bookId', authenticateToken, userBookController.removeFromLibrary);
router.get('/check/:bookId', authenticateToken, userBookController.checkInLibrary);

module.exports = router;