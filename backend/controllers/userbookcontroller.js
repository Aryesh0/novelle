const UserBook = require('../models/userbook');
const Book = require('../models/book');

// Add book to user's library
exports.addToLibrary = async (req, res) => {
    try {
        const { bookId, status = 'want-to-read' } = req.body;
        const userId = req.userId;

        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: 'Book ID is required'
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

        // Check if already in library
        let userBook = await UserBook.findOne({ userId, bookId });

        if (userBook) {
            return res.status(400).json({
                success: false,
                message: 'Book already in your library'
            });
        }

        // Create new user book entry
        userBook = new UserBook({
            userId,
            bookId,
            status,
            startedAt: status === 'currently-reading' ? Date.now() : null
        });

        await userBook.save();

        res.status(201).json({
            success: true,
            message: 'Book added to library',
            userBook: userBook
        });

    } catch (error) {
        console.error('Add to library error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add book to library'
        });
    }
};

// Update reading status
exports.updateStatus = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { status, progress } = req.body;
        const userId = req.userId;

        const userBook = await UserBook.findOne({ userId, bookId });

        if (!userBook) {
            return res.status(404).json({
                success: false,
                message: 'Book not found in your library'
            });
        }

        if (status) {
            userBook.status = status;
            
            if (status === 'currently-reading' && !userBook.startedAt) {
                userBook.startedAt = Date.now();
            }
            
            if (status === 'finished') {
                userBook.finishedAt = Date.now();
                userBook.progress = 100;
            }
        }

        if (progress !== undefined) {
            userBook.progress = Math.min(100, Math.max(0, progress));
        }

        userBook.updatedAt = Date.now();
        await userBook.save();

        res.status(200).json({
            success: true,
            message: 'Reading status updated',
            userBook: userBook
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update reading status'
        });
    }
};

// Get user's library
exports.getUserLibrary = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, page = 1, limit = 20 } = req.query;

        const query = { userId };
        if (status) {
            query.status = status;
        }

        const userBooks = await UserBook.find(query)
            .populate('bookId')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await UserBook.countDocuments(query);

        res.status(200).json({
            success: true,
            books: userBooks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get user library error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get library'
        });
    }
};

// Remove book from library
exports.removeFromLibrary = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.userId;

        const result = await UserBook.findOneAndDelete({ userId, bookId });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Book not found in your library'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Book removed from library'
        });

    } catch (error) {
        console.error('Remove from library error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove book from library'
        });
    }
};

// Check if book is in user's library
exports.checkInLibrary = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.userId;

        const userBook = await UserBook.findOne({ userId, bookId });

        res.status(200).json({
            success: true,
            inLibrary: !!userBook,
            userBook: userBook || null
        });

    } catch (error) {
        console.error('Check in library error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check library status'
        });
    }
};