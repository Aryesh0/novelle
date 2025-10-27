const axios = require('axios');

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// Helper to transform Google Books API response to our format
function transformBookData(item) {
    const volumeInfo = item.volumeInfo || {};
    
    return {
        googleBooksId: item.id,
        title: volumeInfo.title || 'Unknown Title',
        authors: volumeInfo.authors || ['Unknown Author'],
        description: volumeInfo.description || 'No description available.',
        coverImage: volumeInfo.imageLinks?.large || volumeInfo.imageLinks?.medium || volumeInfo.imageLinks?.thumbnail || '',
        thumbnail: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '',
        categories: volumeInfo.categories || ['General'],
        isbn: volumeInfo.industryIdentifiers?.[0]?.identifier || '',
        publishedDate: volumeInfo.publishedDate || '',
        publisher: volumeInfo.publisher || '',
        pageCount: volumeInfo.pageCount || 0,
        language: volumeInfo.language || 'en',
        averageRating: volumeInfo.averageRating || 0,
        ratingsCount: volumeInfo.ratingsCount || 0
    };
}

// Search books by query
async function searchBooks(query, maxResults = 40) {
    try {
        const response = await axios.get(GOOGLE_BOOKS_API, {
            params: {
                q: query,
                maxResults: maxResults,
                printType: 'books',
                orderBy: 'relevance'
            }
        });

        if (!response.data.items) {
            return [];
        }

        return response.data.items.map(transformBookData);
    } catch (error) {
        console.error('Google Books API Error:', error.message);
        throw error;
    }
}

// Get books by genre/category
async function getBooksByGenre(genre, maxResults = 40) {
    try {
        const response = await axios.get(GOOGLE_BOOKS_API, {
            params: {
                q: `subject:${genre}`,
                maxResults: maxResults,
                printType: 'books',
                orderBy: 'relevance'
            }
        });

        if (!response.data.items) {
            return [];
        }

        return response.data.items.map(transformBookData);
    } catch (error) {
        console.error('Google Books API Error:', error.message);
        throw error;
    }
}

// Get book by Google Books ID
async function getBookById(googleBooksId) {
    try {
        const response = await axios.get(`${GOOGLE_BOOKS_API}/${googleBooksId}`);
        return transformBookData(response.data);
    } catch (error) {
        console.error('Google Books API Error:', error.message);
        throw error;
    }
}

// Get popular books (bestsellers)
async function getPopularBooks(maxResults = 40) {
    try {
        const response = await axios.get(GOOGLE_BOOKS_API, {
            params: {
                q: 'subject:fiction',
                maxResults: maxResults,
                printType: 'books',
                orderBy: 'relevance'
            }
        });

        if (!response.data.items) {
            return [];
        }

        return response.data.items.map(transformBookData);
    } catch (error) {
        console.error('Google Books API Error:', error.message);
        throw error;
    }
}

module.exports = {
    searchBooks,
    getBooksByGenre,
    getBookById,
    getPopularBooks,
    transformBookData
};