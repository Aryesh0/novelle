import React, { useState, useEffect } from 'react';
import { Book, Search, Filter, X, Crown, TrendingUp } from 'lucide-react';

export default function BrowsePage({ onNavigate }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('-averageRating');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const categories = [
    'All', 'Fiction', 'Mystery', 'Science Fiction', 'Romance', 
    'Fantasy', 'Thriller', 'Biography', 'History', 'Self-Help'
  ];

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch books when page, sort, or filters change
  useEffect(() => {
    fetchBooks();
  }, [page, sortBy]);

  // Reset page when search or category changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory]);

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${process.env.REACT_APP_API_URL}/api/books/all?page=${page}&limit=20&sort=${sortBy}`;
      
      if (selectedCategory && selectedCategory !== 'All') {
        url = `${process.env.REACT_APP_API_URL}/api/books/genre/${encodeURIComponent(selectedCategory)}?page=${page}&limit=20&sort=${sortBy}`;
      }

      console.log('Fetching books from:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);

      const data = await response.json();
      if (data.success) {
        setBooks(data.books || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.message || 'Failed to load books');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSelectedCategory('All');
      fetchBooks();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const url = `${process.env.REACT_APP_API_URL}/api/books/search?query=${encodeURIComponent(searchQuery)}&limit=40`;
      console.log('Searching books:', url);
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setBooks(data.books || []);
        setTotalPages(1);
      } else {
        setError(data.message || 'No results found');
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    if (category === 'All') {
      fetchBooks();
    } else {
      setLoading(true);
      setError('');
      try {
        const url = `${process.env.REACT_APP_API_URL}/api/books/genre/${encodeURIComponent(category)}?limit=40`;
        console.log('Filtering by genre:', url);
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
          setBooks(data.books || []);
          setTotalPages(1);
        } else {
          setError(data.message || 'No books in this genre');
        }
      } catch (error) {
        console.error('Error filtering books:', error);
        setError('Failed to filter. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('-averageRating');
    setPage(1);
    fetchBooks();
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`text-lg ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const renderBookCard = (book) => (
    <div
      key={book._id}
      onClick={() => onNavigate && onNavigate('bookDetail', book._id)}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 cursor-pointer"
    >
      <div className="h-64 bg-gray-200 overflow-hidden">
        {book.thumbnail || book.coverImage ? (
          <img
            src={book.thumbnail || book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-pink-200">
            <Book className="w-16 h-16 text-white" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
          {book.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-1">
          {book.authors?.join(', ') || 'Unknown Author'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {renderStars(book.averageRating || 0)}
            <span className="ml-2 text-sm text-gray-600">
              {book.averageRating > 0 ? book.averageRating.toFixed(1) : 'New'}
            </span>
          </div>
          {book.reviewCount > 0 && (
            <span className="text-xs text-gray-500">{book.reviewCount} reviews</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate && onNavigate('home')}
              className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition"
            >
              <Book className="w-6 h-6" />
              <span className="text-xl font-bold">Back to Home</span>
            </button>

            {user?.isPremium && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-bold">Premium</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Books</h1>
          <p className="text-gray-600">Discover your next great read</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Filters & Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort + Clear */}
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
            >
              <option value="-averageRating">Highest Rated</option>
              <option value="averageRating">Lowest Rated</option>
              <option value="title">Title (A-Z)</option>
              <option value="-title">Title (Z-A)</option>
              <option value="-reviewCount">Most Reviewed</option>
              <option value="reviewCount">Least Reviewed</option>
            </select>

            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-20">
            <Book className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading books...</p>
          </div>
        ) : books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {books.map(renderBookCard)}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-4 mt-12">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-6 py-2 bg-white rounded-full font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4 rotate-180" />
                <span>Previous</span>
              </button>
              <span className="text-gray-700 font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-6 py-2 bg-white rounded-full font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next</span>
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No books found</p>
            <button
              onClick={handleClearFilters}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}