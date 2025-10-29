import React, { useState, useEffect } from 'react';
import { Book, BookOpen, Check, Clock, Heart } from 'lucide-react';

export default function MyBooksPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('all');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      alert('Please login to view your library');
      onNavigate && onNavigate('login');
      return;
    }
    
    setUser(JSON.parse(storedUser));
    fetchUserBooks();
  }, [activeTab]);

  const fetchUserBooks = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/user-books/library${statusParam}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log('Fetch user books response status:', response.status); // DEBUG: Log status
      const data = await response.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (error) {
      console.error('Error fetching user books:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookStatus = async (bookId, newStatus) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/user-books/${bookId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      console.log('Update status response status:', response.status); // DEBUG: Log status
      const data = await response.json();
      if (data.success) {
        fetchUserBooks();
      }
    } catch (error) {
      console.error('Error updating book status:', error);
    }
  };

  const removeBook = async (bookId) => {
    if (!window.confirm('Remove this book from your library?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/user-books/${bookId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log('Remove book response status:', response.status); // DEBUG: Log status
      const data = await response.json();
      if (data.success) {
        fetchUserBooks();
      }
    } catch (error) {
      console.error('Error removing book:', error);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Books', icon: Book },
    { id: 'want-to-read', label: 'Want to Read', icon: Heart },
    { id: 'currently-reading', label: 'Currently Reading', icon: BookOpen },
    { id: 'finished', label: 'Finished', icon: Check }
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`text-lg ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onNavigate && onNavigate('home')}
            className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition"
          >
            <Book className="w-6 h-6" />
            <span className="text-xl font-bold">Back to Home</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Library</h1>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-20">
            <Book className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading your library...</p>
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((userBook) => {
              const book = userBook.bookId;
              if (!book) return null;

              return (
                <div
                  key={userBook._id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
                >
                  <div className="flex">
                    {/* Book Cover */}
                    <div
                      onClick={() => onNavigate && onNavigate('bookDetail', book._id)}
                      className="w-32 h-48 bg-gray-200 flex-shrink-0 cursor-pointer"
                    >
                      {book.thumbnail || book.coverImage ? (
                        <img
                          src={book.thumbnail || book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-pink-200">
                          <Book className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 p-4">
                      <h3
                        onClick={() => onNavigate && onNavigate('bookDetail', book._id)}
                        className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-orange-500"
                      >
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {book.authors?.join(', ') || 'Unknown Author'}
                      </p>

                      <div className="flex items-center mb-3">
                        {renderStars(book.averageRating || 0)}
                      </div>

                      {/* Progress Bar for Currently Reading */}
                      {userBook.status === 'currently-reading' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{userBook.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all"
                              style={{ width: `${userBook.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Status Selector */}
                      <select
                        value={userBook.status}
                        onChange={(e) => updateBookStatus(book._id, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none mb-2"
                      >
                        <option value="want-to-read">Want to Read</option>
                        <option value="currently-reading">Currently Reading</option>
                        <option value="finished">Finished</option>
                      </select>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeBook(book._id)}
                        className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Remove from Library
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">
              {activeTab === 'all'
                ? 'Your library is empty'
                : `No books in "${tabs.find(t => t.id === activeTab)?.label}"`}
            </p>
            <button
              onClick={() => onNavigate && onNavigate('browse')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg transition"
            >
              Browse Books
            </button>
          </div>
        )}
      </div>
    </div>
  );
}