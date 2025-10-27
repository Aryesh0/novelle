const Book = require('../models/book');
const googleBooksService = require('../services/googlebooksservice');

// Search and cache books
exports.searchBooks = async (req, res) => {
    try {
        const { query, page = 1, limit = 20 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // First, try to find in cache
        const cachedBooks = await Book.find({
            $text: { $search: query }
        })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

        if (cachedBooks.length > 0) {
            return res.status(200).json({
                success: true,
                source: 'cache',
                books: cachedBooks,
                count: cachedBooks.length
            });
        }

        // If not in cache, fetch from Google Books API
        const booksFromAPI = await googleBooksService.searchBooks(query, parseInt(limit));

        // Cache the books
        const savedBooks = [];
        for (const bookData of booksFromAPI) {
            try {
                const existingBook = await Book.findOne({ googleBooksId: bookData.googleBooksId });
                
                if (!existingBook) {
                    const newBook = new Book(bookData);
                    await newBook.save();
                    savedBooks.push(newBook);
                } else {
                    savedBooks.push(existingBook);
                }
            } catch (err) {
                console.error('Error caching book:', err);
            }
        }

        res.status(200).json({
            success: true,
            source: 'api',
            books: savedBooks,
            count: savedBooks.length
        });

    } catch (error) {
        console.error('Search books error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search books'
        });
    }
};

// Get books by genre
exports.getBooksByGenre = async (req, res) => {
    try {
        const { genre } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // First check cache
        const cachedBooks = await Book.find({
            categories: { $regex: new RegExp(genre, 'i') }
        })
        .sort({ averageRating: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

        if (cachedBooks.length >= 10) {
            return res.status(200).json({
                success: true,
                source: 'cache',
                genre: genre,
                books: cachedBooks,
                count: cachedBooks.length
            });
        }

        // Fetch from API if cache doesn't have enough
        const booksFromAPI = await googleBooksService.getBooksByGenre(genre, 40);

        // Cache the books
        const savedBooks = [];
        for (const bookData of booksFromAPI) {
            try {
                const existingBook = await Book.findOne({ googleBooksId: bookData.googleBooksId });
                
                if (!existingBook) {
                    const newBook = new Book(bookData);
                    await newBook.save();
                    savedBooks.push(newBook);
                } else {
                    savedBooks.push(existingBook);
                }
            } catch (err) {
                console.error('Error caching book:', err);
            }
        }

        res.status(200).json({
            success: true,
            source: 'api',
            genre: genre,
            books: savedBooks,
            count: savedBooks.length
        });

    } catch (error) {
        console.error('Get books by genre error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get books by genre'
        });
    }
};

// Get single book by ID
exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;

        // Try to find in our database first
        let book = await Book.findById(id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        res.status(200).json({
            success: true,
            book: book
        });

    } catch (error) {
        console.error('Get book by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get book'
        });
    }
};

// Get featured/popular books
exports.getFeaturedBooks = async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        // Check cache first
        let books = await Book.find()
            .sort({ averageRating: -1, ratingsCount: -1 })
            .limit(parseInt(limit));

        if (books.length >= 10) {
            return res.status(200).json({
                success: true,
                source: 'cache',
                books: books,
                count: books.length
            });
        }

        // Fetch popular books from API
        const booksFromAPI = await googleBooksService.getPopularBooks(40);

        // Cache the books
        const savedBooks = [];
        for (const bookData of booksFromAPI) {
            try {
                const existingBook = await Book.findOne({ googleBooksId: bookData.googleBooksId });
                
                if (!existingBook) {
                    const newBook = new Book(bookData);
                    await newBook.save();
                    savedBooks.push(newBook);
                } else {
                    savedBooks.push(existingBook);
                }
            } catch (err) {
                console.error('Error caching book:', err);
            }
        }

        res.status(200).json({
            success: true,
            source: 'api',
            books: savedBooks,
            count: savedBooks.length
        });

    } catch (error) {
        console.error('Get featured books error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get featured books'
        });
    }
};

// Get all books (with pagination)
exports.getAllBooks = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-averageRating' } = req.query;

        const books = await Book.find()
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Book.countDocuments();

        res.status(200).json({
            success: true,
            books: books,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get all books error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get books'
        });
    }
};