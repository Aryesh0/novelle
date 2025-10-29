import React, { useState, useEffect } from 'react';
import { Book, Star, TrendingUp, Users, Search, Menu, X, Crown } from 'lucide-react';
import PremiumModal from './PremiumModal';

export default function NovellHomepage({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreBooks, setGenreBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  const trendingGenres = [
    { name: "Fiction", count: "12.5k", color: "from-purple-400 to-pink-400" },
    { name: "Mystery", count: "8.2k", color: "from-blue-400 to-cyan-400" },
    { name: "Science Fiction", count: "9.8k", color: "from-green-400 to-teal-400" },
    { name: "Romance", count: "11.3k", color: "from-red-400 to-orange-400" }
  ];

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchFeaturedBooks();
  }, []);

  // Fetch featured books from backend (which pulls from Google Books API)
  const fetchFeaturedBooks = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/books/featured?limit=8`);
      console.log('Featured books fetch URL:', `${process.env.REACT_APP_API_URL}/api/books/featured?limit=8`);
      console.log('Featured response status:', response.status);
      
      const data = await response.json();
      if (data.success) {
        setFeaturedBooks(data.books || []);
      } else {
        console.warn('Featured books failed:', data.message);
      }
    } catch (error) {
      console.error('Error fetching featured books:', error);
    }
  };

  // Search books
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSelectedGenre(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/books/search?query=${encodeURIComponent(searchQuery)}&limit=20`
      );
      console.log('Search response status:', response.status);
      const data = await response.json();
      if (data.success) {
        setGenreBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch books by genre
  const handleGenreClick = async (genreName) => {
    setLoading(true);
    setSelectedGenre(genreName);
    setSearchQuery('');
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/books/genre/${encodeURIComponent(genreName)}?limit=20`
      );
      console.log('Genre response status:', response.status);
      const data = await response.json();
      if (data.success) {
        setGenreBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error fetching genre books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear search/genre filter
  const clearFilter = () => {
    setSelectedGenre(null);
    setGenreBooks([]);
    setSearchQuery('');
  };

  // Logout user
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setShowDropdown(false);
    onNavigate && onNavigate('home');
  };

  // Premium success
  const handlePremiumSuccess = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setShowPremiumModal(false);
  };

  // Navigate to book detail
  const handleBookClick = (bookId) => {
    onNavigate && onNavigate('bookDetail', bookId);
  };

  // Render star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < fullStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // Render individual book card
  const renderBookCard = (book) => (
    <div
      key={book._id}
      onClick={() => handleBookClick(book._id)}
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
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
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
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSuccess={handlePremiumSuccess}
      />

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => { clearFilter(); onNavigate && onNavigate('home'); }}
            >
              <Book className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text text-transparent">
                Novelle
              </span>
            </div>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => clearFilter()} className="text-gray-700 hover:text-orange-500 transition">Home</button>
              <button onClick={() => onNavigate && onNavigate('browse')} className="text-gray-700 hover:text-orange-500 transition">Browse</button>
              <button onClick={() => onNavigate && onNavigate('community')} className="text-gray-700 hover:text-orange-500 transition">Community</button>
              <button onClick={() => onNavigate && onNavigate('myBooks')} className="text-gray-700 hover:text-orange-500 transition">My Books</button>
            </div>

            {/* Desktop User Section */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {/* Premium Button */}
                  {!user.isPremium ? (
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-full font-bold hover:shadow-lg transition flex items-center space-x-2"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Premium</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-full font-bold flex items-center space-x-2">
                      <Crown className="w-4 h-4" />
                      <span>Premium</span>
                    </div>
                  )}

                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 rounded-full transition"
                    >
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">
                          {user.fullname?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="font-semibold text-gray-700 hidden sm:inline">@{user.username}</span>
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">{user.fullname}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            {user.isPremium && (
                              <div className="mt-2 flex items-center space-x-1 text-xs text-yellow-600">
                                <Crown className="w-3 h-3" />
                                <span>Premium Member</span>
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => { setShowDropdown(false); onNavigate && onNavigate('profile'); }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center space-x-3"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm text-gray-700 font-semibold">View Profile</span>
                          </button>
                          
                          <button
                            onClick={() => { setShowDropdown(false); onNavigate && onNavigate('myBooks'); }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center space-x-3"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="text-sm text-gray-700">My Books</span>
                          </button>
                          
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              onClick={handleLogout}
                              className="w-full px-4 py-3 text-left hover:bg-red-50 transition flex items-center space-x-3"
                            >
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span className="text-sm text-red-600 font-semibold">Logout</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button 
                    className="px-4 py-2 text-gray-700 hover:text-orange-500 transition"
                    onClick={() => onNavigate && onNavigate('login')}
                  >
                    Login
                  </button>
                  <button 
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-full hover:shadow-lg transition"
                    onClick={() => window.location.href = '/register.html'}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-3">
              <button onClick={() => { clearFilter(); setMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-orange-500">Home</button>
              <button onClick={() => { onNavigate && onNavigate('browse'); setMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-orange-500">Browse</button>
              <button onClick={() => { onNavigate && onNavigate('community'); setMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-orange-500">Community</button>
              <button onClick={() => { onNavigate && onNavigate('myBooks'); setMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-orange-500">My Books</button>
              
              {user ? (
                <>
                  {!user.isPremium && (
                    <button 
                      className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-full font-bold flex items-center justify-center space-x-2"
                      onClick={() => { setShowPremiumModal(true); setMenuOpen(false); }}
                    >
                      <Crown className="w-4 h-4" />
                      <span>Upgrade to Premium</span>
                    </button>
                  )}
                  <button 
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-full flex items-center justify-center space-x-2"
                    onClick={() => { onNavigate && onNavigate('profile'); setMenuOpen(false); }}
                  >
                    <span>@{user.username}</span>
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-full"
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-full"
                    onClick={() => { onNavigate && onNavigate('login'); setMenuOpen(false); }}
                  >
                    Login
                  </button>
                  <button 
                    className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-full"
                    onClick={() => { window.location.href = '/register.html'; setMenuOpen(false); }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Discover your next
            <span className="block bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              favorite book
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your reading, discover new books, and connect with fellow book lovers
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for books, authors, or genres..."
                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-gray-200 focus:border-orange-500 focus:outline-none shadow-lg"
              />
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">2.5M+</p>
                <p className="text-gray-600">Books</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">500K+</p>
                <p className="text-gray-600">Readers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-green-400 to-teal-400 rounded-xl">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">10M+</p>
                <p className="text-gray-600">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {selectedGenre || searchQuery ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedGenre ? `${selectedGenre} Books` : `Search Results for "${searchQuery}"`}
              </h2>
              <button
                onClick={clearFilter}
                className="text-orange-500 hover:text-orange-600 font-semibold"
              >
                Clear Filter
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Book className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Loading books...</p>
              </div>
            ) : genreBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {genreBooks.map(renderBookCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No books found. Try a different search.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Featured Books</h2>
              <button
                onClick={() => onNavigate && onNavigate('browse')}
                className="text-orange-500 hover:text-orange-600 font-semibold flex items-center"
              >
                View All
                <TrendingUp className="w-5 h-5 ml-2" />
              </button>
            </div>

            {featuredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredBooks.map(renderBookCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <Book className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Loading featured books...</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trending Genres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Browse by Genre</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trendingGenres.map((genre, index) => (
            <button
              key={index}
              onClick={() => handleGenreClick(genre.name)}
              className={`bg-gradient-to-br ${genre.color} rounded-2xl p-6 text-white hover:shadow-xl transition cursor-pointer transform hover:scale-105`}
            >
              <p className="text-2xl font-bold mb-2">{genre.name}</p>
              <p className="text-white/80">{genre.count} books</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-3 text-gray-700">
                <li><a href="#" className="hover:text-orange-500 transition text-sm">About us</a></li>
                <li><a href="#" className="hover:text-orange-500 transition text-sm">Careers</a></li>
                <li><a href="#" className="hover:text-orange-500 transition text-sm">Terms</a></li>
                <li><a href="#" className="hover:text-orange-500 transition text-sm">Privacy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Work With Us</h3>
              <ul className="space-y-3 text-gray-700">
                <li><a href="#" className="hover:text-orange-500 transition text-sm">Authors</a></li>
                <li><a href="#" className="hover:text-orange-500 transition text-sm">Advertise</a></li>
                <li><a href="#" className="hover:text-orange-500 transition text-sm">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center hover:bg-orange-500 transition">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <p className="text-gray-700 text-sm">© 2025 Novelle, Inc.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}